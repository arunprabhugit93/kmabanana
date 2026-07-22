import { writeAudit } from "./audit";
import { sendEmail } from "./email";
import { sendWhatsAppTemplate } from "./whatsapp";
import { amountInWords, getBusinessDetails, invoiceHeaderHtml, INVOICE_STYLE, logoDataUrl, partyBoxHtml, signatureBlockHtml } from "./invoiceBranding";
import { all, e, html, money } from "./util";

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

export async function saleInvoiceHtml(db: D1Database, id: string, env: Env) {
  const { invoice, items } = await saleInvoiceDetail(db, Number(id));
  if (!invoice) return html("Invoice not found", 404);
  const vendor = await db.prepare("SELECT phone, market, address, email, gst FROM vendors WHERE id = ?").bind(invoice.vendor_id).first<{ phone: string; market: string; address: string; email: string; gst: string }>();
  const business = await getBusinessDetails(db);
  const logoSrc = await logoDataUrl(env);
  const rows = items.map((item) => `<tr><td>${e(item.banana_type)} (${e(item.grade)})</td><td class="num">${e(item.net_weight_kg)}</td><td class="num">${money(item.rate)}</td><td class="num">${money(item.amount)}</td></tr>`).join("");
  const voidBadge = invoice.status === "void" ? '<span class="badge" style="background:#fff0ee;border-color:#edc4bf;color:#b3463c">VOID</span>' : `<span class="badge">${e(invoice.status)}</span>`;
  return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>${INVOICE_STYLE}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet">
${invoiceHeaderHtml(business, logoSrc)}
<div class="billmeta"><span><strong>Sales Invoice</strong> ${e(invoice.invoice_no)}</span><span>Date: <strong>${e(invoice.invoice_date)}</strong></span><span>Vehicle: <strong>${e(invoice.vehicle_no || "-")}</strong></span><span>${voidBadge}</span></div>
<section class="meta">
${partyBoxHtml("Buyer", invoice.vendor_name, vendor?.phone || "", "Market", vendor?.market || "", vendor?.address || "", vendor?.email || "", vendor?.gst || "")}
<div class="box"><div class="label">Notes</div><div class="value" style="font-size:.9rem;font-weight:600">${e(invoice.notes || "-")}</div></div>
</section>
<table><thead><tr><th>Banana (grade)</th><th class="num">Net kg</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table>
<p class="words">${amountInWords(invoice.total)}</p>
<div class="footer-row">${signatureBlockHtml(business.name)}</div>
<p class="footer">Generated from ${e(business.name)} Desk.</p>
</main></body></html>`);
}

function saleInvoiceText(businessName: string, invoice: SaleInvoiceRow, items: SaleInvoiceItemRow[]) {
  return [
    `${businessName} - Sales Invoice ${invoice.invoice_no}`,
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
  const business = await getBusinessDetails(db);
  const text = saleInvoiceText(business.name, invoice, items);
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
