import { all, money } from "./util";

export async function dailyReport(db: D1Database, reportDate: string) {
  const purchases = await all(db, "SELECT * FROM purchases WHERE purchase_date = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", reportDate) as PurchaseRow[];
  const sales = await all(db, "SELECT * FROM sales WHERE sale_date = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", reportDate) as SaleRow[];
  const pv = purchases.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const sv = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const pending = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate) - Number(row.paid), 0);
  return [
    `KMS Banana Daily Report - ${reportDate}`,
    `Purchase value: ${money(pv)}`,
    `Sales value: ${money(sv)}`,
    `Pending collection: ${money(pending)}`,
    "",
    "Purchases:",
    ...purchases.map((row) => `${row.farmer_name} | ${row.banana_type} | ${row.weight_kg} kg | ${money(Number(row.weight_kg) * Number(row.rate))} | ${row.vehicle_no}`),
    "",
    "Sales:",
    ...sales.map((row) => `${row.vendor_name} | ${row.banana_type} | ${row.weight_kg} kg | ${money(Number(row.weight_kg) * Number(row.rate))} | paid ${money(row.paid)} | ${row.vehicle_no}`)
  ].join("\n");
}

export async function sendDailyEmail(db: D1Database, env: Env, reportDate: string) {
  const recipients = (await db.prepare("SELECT value FROM settings WHERE key = ?").bind("daily_email_recipients").first<{ value: string }>())?.value || "";
  const subject = `Banana merchant daily report ${reportDate}`;
  const body = await dailyReport(db, reportDate);
  let status = "draft";
  let message = "Email provider is not configured. Report was saved as a draft log.";
  if (env.RESEND_API_KEY && env.EMAIL_FROM && recipients) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: recipients.split(",").map((x) => x.trim()).filter(Boolean), subject, text: body })
    });
    status = response.ok ? "sent" : "failed";
    message = await response.text();
  }
  await db.prepare(
    "INSERT INTO email_logs (report_date, recipients, subject, body, status, provider_message) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(reportDate, recipients, subject, body, status, message).run();
  return { status, message };
}
