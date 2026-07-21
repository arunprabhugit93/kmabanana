import { writeAudit } from "./audit";
import { sendEmail } from "./email";
import { sendWhatsAppTemplate } from "./whatsapp";
import { all, arrayBufferToBase64, e, html, money } from "./util";

type ItemInput = {
  banana_type: string;
  grade: string;
  net_weight_kg: number;
  rate: number;
  notes?: string;
};

export async function listSaleInvoices(db: D1Database, month?: string) {
  const monthLike = `${month || new Date().toISOString().slice(0, 7)}-%`;
  return all(
    db,
    "SELECT * FROM sale_invoices WHERE invoice_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY invoice_date DESC, id DESC",
    monthLike
  );
}

export async function saleInvoiceDetail(db: D1Database, id: number) {
  const invoice = await db.prepare("SELECT * FROM sale_invoices WHERE id = ?").bind(id).first<SaleInvoiceRow>();
  const items = await all(db, "SELECT * FROM sale_invoice_items WHERE invoice_id = ? ORDER BY id", id) as SaleInvoiceItemRow[];
  return { invoice, items };
}

// What came in on this vehicle on this date (from purchase invoices),
// minus what's already been sold against it on other sale invoices —
// used to auto-populate the sales invoice form. Still fully editable
// before saving.
export async function vehicleLoadAvailable(db: D1Database, vehicleNo: string, date: string) {
  const purchased = await all(
    db,
    `SELECT pi.banana_type, pi.grade, SUM(pi.net_weight_kg) AS kg
     FROM purchase_invoice_items pi
     JOIN purchase_invoices p ON p.id = pi.invoice_id
     WHERE pi.vehicle_no = ? AND p.invoice_date = ? AND p.status != 'void' AND (p.deleted_at = '' OR p.deleted_at IS NULL)
     GROUP BY pi.banana_type, pi.grade`,
    vehicleNo,
    date
  ) as Array<{ banana_type: string; grade: string; kg: number }>;

  const sold = await all(
    db,
    `SELECT si.banana_type, si.grade, SUM(si.net_weight_kg) AS kg
     FROM sale_invoice_items si
     JOIN sale_invoices s ON s.id = si.invoice_id
     WHERE s.vehicle_no = ? AND s.invoice_date = ? AND s.status != 'void' AND (s.deleted_at = '' OR s.deleted_at IS NULL)
     GROUP BY si.banana_type, si.grade`,
    vehicleNo,
    date
  ) as Array<{ banana_type: string; grade: string; kg: number }>;

  const soldMap = new Map(sold.map((row) => [`${row.banana_type}|${row.grade}`, Number(row.kg)]));
  return purchased.map((row) => {
    const key = `${row.banana_type}|${row.grade}`;
    const purchasedKg = Number(row.kg);
    const soldKg = soldMap.get(key) || 0;
    return { banana_type: row.banana_type, grade: row.grade, purchased_kg: purchasedKg, sold_kg: soldKg, available_kg: Math.max(0, purchasedKg - soldKg) };
  });
}

export async function createSaleInvoice(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const items = Array.isArray(input.items) ? (input.items as ItemInput[]) : [];
  if (!items.length) throw new Error("Add at least one line item before saving the invoice.");
  const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first<{ name: string }>();
  if (!vendor) throw new Error("Select a valid buyer.");

  const computed = items.map((item) => ({ ...item, amount: Number(item.net_weight_kg) * Number(item.rate) }));
  const total = computed.reduce((sum, item) => sum + item.amount, 0);
  const paid = Number(input.paid || 0);
  const pending = total - paid;

  const invoiceNo = `SINV-${Date.now()}`;
  const invoiceDate = String(input.invoice_date);
  const result = await db.prepare(
    "INSERT INTO sale_invoices (invoice_no, invoice_date, vendor_id, vendor_name, vehicle_no, total, paid, pending, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(invoiceNo, invoiceDate, Number(input.vendor_id), vendor.name, input.vehicle_no || "", total, paid, pending, pending > 0 ? "open" : "paid", input.notes || "", changedBy).run();
  const invoiceId = result.meta.last_row_id;

  for (const item of computed) {
    await db.prepare(
      "INSERT INTO sale_invoice_items (invoice_id, banana_type, grade, net_weight_kg, rate, amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(invoiceId, item.banana_type, item.grade, Number(item.net_weight_kg), Number(item.rate), item.amount, item.notes || "").run();
  }

  await writeAudit(db, "sale_invoice", invoiceId, "create", changedBy, null, { invoice_no: invoiceNo, vendor_id: input.vendor_id, total, paid, items: computed.length });
  return invoiceId;
}

export async function updateSaleInvoicePaid(db: D1Database, id: number, paid: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM sale_invoices WHERE id = ?").bind(id).first<SaleInvoiceRow>();
  if (!before) throw new Error("Invoice not found.");
  const pending = before.total - paid;
  await db.prepare("UPDATE sale_invoices SET paid = ?, pending = ?, status = ? WHERE id = ?").bind(paid, pending, pending > 0 ? "open" : "paid", id).run();
  await writeAudit(db, "sale_invoice", id, "update", changedBy, before, { paid, pending });
}

export async function voidSaleInvoice(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM sale_invoices WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE sale_invoices SET status = 'void' WHERE id = ?").bind(id).run();
  await writeAudit(db, "sale_invoice", id, "void", changedBy, before, { status: "void" });
}

async function logoDataUrl(env: Env) {
  try {
    if (!env?.ASSETS) return "/logo.png";
    const response = await env.ASSETS.fetch(new Request("https://assets.local/logo.png"));
    if (!response.ok) return "/logo.png";
    return `data:image/png;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
  } catch {
    return "/logo.png";
  }
}

const INVOICE_STYLE = `*{box-sizing:border-box}body{background:radial-gradient(circle at 85% 6%,rgba(255,205,49,.24),transparent 260px),#f4f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;margin:0;padding:28px}.sheet{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,255,255,.94)),radial-gradient(circle at 90% 12%,rgba(255,209,58,.22),transparent 280px);border:1px solid #dce3d8;margin:auto;max-width:960px;overflow:hidden;padding:34px;position:relative}.sheet:after{color:rgba(217,173,58,.08);content:"KMS BANANA";font-size:5rem;font-weight:900;position:absolute;right:-20px;top:44%;transform:rotate(-18deg);z-index:0}.sheet>*{position:relative;z-index:1}.actions{margin:0 auto 16px;max-width:960px}button{background:#2f6b43;border:0;border-radius:7px;color:#fff;font-weight:700;padding:10px 14px}.top{align-items:start;border-bottom:3px solid #2f6b43;display:grid;grid-template-columns:1fr auto;gap:24px;padding-bottom:22px}.brandrow{align-items:center;display:flex;gap:14px}.brandrow img{height:72px;object-fit:contain;width:150px}.brand{font-size:1.8rem;font-weight:900}.muted{color:#66736a}.badge{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:#184c2c;display:inline-block;font-size:.78rem;font-weight:800;margin-top:8px;padding:5px 10px;text-transform:uppercase}.meta{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px;margin:24px 0}.box{border:1px solid #dce3d8;border-radius:8px;padding:14px}.label{color:#66736a;font-size:.72rem;font-weight:800;text-transform:uppercase}.value{font-size:1rem;font-weight:800;margin-top:5px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e8ede4;padding:11px 9px;text-align:left}th{background:#f6f8f4;color:#66736a;font-size:.72rem;text-transform:uppercase}.num{text-align:right}.totals{margin-left:auto;margin-top:24px;width:340px}.totals td,.totals th{border:1px solid #dce3d8}.totals .due{background:#fff7df;font-size:1.05rem}.footer{border-top:1px solid #dce3d8;color:#66736a;font-size:.85rem;margin-top:34px;padding-top:14px}@media print{body{background:#fff;padding:0}.actions{display:none}.sheet{border:0;max-width:none;padding:20px}}`;

export async function saleInvoiceHtml(db: D1Database, id: string, env: Env) {
  const { invoice, items } = await saleInvoiceDetail(db, Number(id));
  if (!invoice) return html("Invoice not found", 404);
  const logoSrc = await logoDataUrl(env);
  const rows = items.map((item) => `<tr><td>${e(item.banana_type)} (${e(item.grade)})</td><td class="num">${e(item.net_weight_kg)}</td><td class="num">${money(item.rate)}</td><td class="num">${money(item.amount)}</td></tr>`).join("");
  const voidBadge = invoice.status === "void" ? '<span class="badge" style="background:#fff0ee;border-color:#edc4bf;color:#b3463c">VOID</span>' : `<span class="badge">${e(invoice.status)}</span>`;
  return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>${INVOICE_STYLE}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet"><section class="top"><div class="brandrow"><img src="${logoSrc}" alt="KMS Banana logo"><div><div class="brand">KMS Banana</div><p class="muted">Vendor sales invoice</p></div></div><div><h1>Sales Invoice</h1><p class="muted">${e(invoice.invoice_no)}</p>${voidBadge}</div></section><section class="meta"><div class="box"><div class="label">Buyer</div><div class="value">${e(invoice.vendor_name)}</div></div><div class="box"><div class="label">Invoice date</div><div class="value">${e(invoice.invoice_date)}</div></div><div class="box"><div class="label">Vehicle</div><div class="value">${e(invoice.vehicle_no || "-")}</div></div></section><table><thead><tr><th>Banana (grade)</th><th class="num">Net kg</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table><p class="footer">Generated from KMS Banana Desk.</p></main></body></html>`);
}

function saleInvoiceText(invoice: SaleInvoiceRow, items: SaleInvoiceItemRow[]) {
  return [
    `KMS Banana - Sales Invoice ${invoice.invoice_no}`,
    `Buyer: ${invoice.vendor_name}`,
    `Date: ${invoice.invoice_date}`,
    `Vehicle: ${invoice.vehicle_no}`,
    "",
    ...items.map((item) => `${item.banana_type} (${item.grade}) | ${item.net_weight_kg} kg @ ${money(item.rate)} = ${money(item.amount)}`),
    "",
    `Total: ${money(invoice.total)}`,
    `Paid: ${money(invoice.paid)}`,
    `Pending: ${money(invoice.pending)}`
  ].join("\n");
}

export async function sendSaleInvoice(db: D1Database, env: Env, id: number, origin: string) {
  const { invoice, items } = await saleInvoiceDetail(db, id);
  if (!invoice) throw new Error("Invoice not found.");
  const vendor = await db.prepare("SELECT email, phone FROM vendors WHERE id = ?").bind(invoice.vendor_id).first<{ email: string; phone: string }>();
  const text = saleInvoiceText(invoice, items);
  const link = `${origin}/sale-invoice/${invoice.id}`;
  const results: { email?: unknown; whatsapp?: unknown } = {};
  if (vendor?.email) {
    results.email = await sendEmail(env, [vendor.email], `Sales invoice ${invoice.invoice_no}`, `${text}\n\nView/print: ${link}`);
  }
  if (vendor?.phone) {
    results.whatsapp = await sendWhatsAppTemplate(env, vendor.phone, "sale_invoice_notice", [invoice.invoice_no, invoice.vendor_name, money(invoice.total), money(invoice.pending), link]);
  }
  return results;
}
