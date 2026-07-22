import { sendEmail } from "./email";
import { sendWhatsAppTemplate } from "./whatsapp";
import { all, money, today } from "./util";

export type ReportRow = {
  banana_type: string;
  grade: string;
  buy_kg: number;
  buy_value: number;
  sell_kg: number;
  sell_value: number;
  margin: number;
};

export async function periodReport(db: D1Database, fromDate: string, toDate: string): Promise<ReportRow[]> {
  const buys = await all(
    db,
    `SELECT pi.banana_type, pi.grade, SUM(pi.net_weight_kg) AS kg, SUM(pi.amount) AS value
     FROM purchase_invoice_items pi JOIN purchase_invoices p ON p.id = pi.invoice_id
     WHERE p.invoice_date BETWEEN ? AND ? AND p.status != 'void' AND (p.deleted_at = '' OR p.deleted_at IS NULL)
     GROUP BY pi.banana_type, pi.grade`,
    fromDate,
    toDate
  ) as Array<{ banana_type: string; grade: string; kg: number; value: number }>;

  const sells = await all(
    db,
    `SELECT si.banana_type, si.grade, SUM(si.net_weight_kg) AS kg, SUM(si.amount) AS value
     FROM sale_invoice_items si JOIN sale_invoices s ON s.id = si.invoice_id
     WHERE s.invoice_date BETWEEN ? AND ? AND s.status != 'void' AND (s.deleted_at = '' OR s.deleted_at IS NULL)
     GROUP BY si.banana_type, si.grade`,
    fromDate,
    toDate
  ) as Array<{ banana_type: string; grade: string; kg: number; value: number }>;

  const key = (b: string, g: string) => `${b}|${g}`;
  const rows = new Map<string, ReportRow>();
  for (const b of buys) {
    rows.set(key(b.banana_type, b.grade), { banana_type: b.banana_type, grade: b.grade, buy_kg: Number(b.kg), buy_value: Number(b.value), sell_kg: 0, sell_value: 0, margin: 0 });
  }
  for (const s of sells) {
    const k = key(s.banana_type, s.grade);
    const row = rows.get(k) || { banana_type: s.banana_type, grade: s.grade, buy_kg: 0, buy_value: 0, sell_kg: 0, sell_value: 0, margin: 0 };
    row.sell_kg = Number(s.kg);
    row.sell_value = Number(s.value);
    rows.set(k, row);
  }
  return Array.from(rows.values()).map((row) => ({ ...row, margin: row.sell_value - row.buy_value })).sort((a, b) => a.banana_type.localeCompare(b.banana_type) || a.grade.localeCompare(b.grade));
}

function reportText(period: string, fromDate: string, toDate: string, rows: ReportRow[]) {
  const totalBuy = rows.reduce((sum, r) => sum + r.buy_value, 0);
  const totalSell = rows.reduce((sum, r) => sum + r.sell_value, 0);
  const label = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;
  return [
    `KMS Banana ${period} report - ${label}`,
    `Total buy value: ${money(totalBuy)}`,
    `Total sell value: ${money(totalSell)}`,
    `Total margin: ${money(totalSell - totalBuy)}`,
    "",
    "By banana type and grade:",
    ...rows.map((r) => `${r.banana_type} (${r.grade}) | buy ${r.buy_kg} kg / ${money(r.buy_value)} | sell ${r.sell_kg} kg / ${money(r.sell_value)} | margin ${money(r.margin)}`)
  ].join("\n");
}

async function getSetting(db: D1Database, key: string) {
  return (await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first<{ value: string }>())?.value || "";
}

export async function sendPeriodReport(db: D1Database, env: Env, period: "Daily" | "Weekly" | "Monthly", fromDate: string, toDate: string) {
  const rows = await periodReport(db, fromDate, toDate);
  const body = reportText(period, fromDate, toDate, rows);
  const subject = `KMS Banana ${period} report (${fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`})`;
  const settingKey = period.toLowerCase() === "daily" ? "daily_email_recipients" : period.toLowerCase() === "weekly" ? "weekly_email_recipients" : "monthly_email_recipients";
  const recipients = (await getSetting(db, settingKey)).split(",").map((x) => x.trim()).filter(Boolean);
  const whatsappNumbers = (await getSetting(db, "whatsapp_numbers")).split(",").map((x) => x.trim()).filter(Boolean);

  let status = "draft";
  let message = "No recipients configured. Report was saved as a draft log.";
  if (recipients.length) {
    const delivery = await sendEmail(env, recipients, subject, body);
    status = delivery.sent ? "sent" : "failed";
    message = delivery.message;
  }
  const totalBuy = rows.reduce((sum, r) => sum + r.buy_value, 0);
  const totalSell = rows.reduce((sum, r) => sum + r.sell_value, 0);
  for (const number of whatsappNumbers) {
    await sendWhatsAppTemplate(env, number, "period_report_notice", [period, fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`, money(totalBuy), money(totalSell), money(totalSell - totalBuy)]);
  }

  await db.prepare(
    "INSERT INTO email_logs (report_date, recipients, subject, body, status, provider_message) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(fromDate, recipients.join(", "), subject, body, status, message).run();
  return { status, message, rows };
}

function isoWeekStart(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export async function runScheduledReports(db: D1Database, env: Env) {
  const date = today();
  await sendPeriodReport(db, env, "Daily", date, date);

  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (day === 1) {
    // Monday: send the report for the week that just ended (Mon-Sun).
    const weekEnd = new Date(`${date}T00:00:00Z`);
    weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    await sendPeriodReport(db, env, "Weekly", isoWeekStart(weekEndStr), weekEndStr);
  }

  const dayOfMonth = Number(date.slice(8, 10));
  if (dayOfMonth === 1) {
    const prevMonthEnd = new Date(`${date}T00:00:00Z`);
    prevMonthEnd.setUTCDate(0); // last day of previous month
    const to = prevMonthEnd.toISOString().slice(0, 10);
    const from = `${to.slice(0, 7)}-01`;
    await sendPeriodReport(db, env, "Monthly", from, to);
  }
}
