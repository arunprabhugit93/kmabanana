import { writeAudit } from "./audit";
import { sendEmail } from "./email";
import { sendWhatsAppTemplate } from "./whatsapp";
import { amountInWords, getBusinessDetails, invoiceHeaderHtml, INVOICE_STYLE, logoDataUrl, partyBoxHtml, signatureBlockHtml } from "./invoiceBranding";
import { all, e, html, money, netWeight } from "./util";

type ItemInput = {
  banana_type: string;
  grade: string;
  units: number;
  gross_weight_kg: number;
  stem_reduction_per_unit: number;
  rate: number;
  vehicle_no?: string;
  notes?: string;
};

export async function listPurchaseInvoices(db: D1Database, month?: string) {
  const monthLike = `${month || new Date().toISOString().slice(0, 7)}-%`;
  return all(
    db,
    "SELECT * FROM purchase_invoices WHERE invoice_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY invoice_date DESC, id DESC",
    monthLike
  );
}

export async function purchaseInvoiceDetail(db: D1Database, id: number) {
  const invoice = await db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").bind(id).first<PurchaseInvoiceRow>();
  const items = await all(db, "SELECT * FROM purchase_invoice_items WHERE invoice_id = ? ORDER BY id", id) as PurchaseInvoiceItemRow[];
  return { invoice, items };
}

export async function createPurchaseInvoice(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const items = Array.isArray(input.items) ? (input.items as ItemInput[]) : [];
  if (!items.length) throw new Error("Add at least one line item before saving the invoice.");
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first<{ name: string }>();
  if (!farmer) throw new Error("Select a valid farmer.");

  const computed = items.map((item) => {
    const netWeightKg = netWeight(item.gross_weight_kg, item.units, item.stem_reduction_per_unit);
    const amount = netWeightKg * Number(item.rate);
    return { ...item, netWeightKg, amount };
  });
  const total = computed.reduce((sum, item) => sum + item.amount, 0);
  const paid = String(input.payment_made) === "yes" ? total : 0;
  const pending = total - paid;

  const invoiceNo = `PINV-${Date.now()}`;
  const invoiceDate = String(input.invoice_date);
  const result = await db.prepare(
    "INSERT INTO purchase_invoices (invoice_no, invoice_date, farmer_id, farmer_name, total, paid, pending, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(invoiceNo, invoiceDate, Number(input.farmer_id), farmer.name, total, paid, pending, pending > 0 ? "open" : "paid", input.notes || "", changedBy).run();
  const invoiceId = result.meta.last_row_id;

  for (const item of computed) {
    await db.prepare(
      "INSERT INTO purchase_invoice_items (invoice_id, banana_type, grade, units, gross_weight_kg, stem_reduction_per_unit, net_weight_kg, rate, amount, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(invoiceId, item.banana_type, item.grade, Number(item.units), Number(item.gross_weight_kg), Number(item.stem_reduction_per_unit || 0), item.netWeightKg, Number(item.rate), item.amount, item.vehicle_no || "", item.notes || "").run();
  }

  await writeAudit(db, "purchase_invoice", invoiceId, "create", changedBy, null, { invoice_no: invoiceNo, farmer_id: input.farmer_id, total, paid, items: computed.length });
  return invoiceId;
}

export async function updatePurchaseInvoicePaid(db: D1Database, id: number, paid: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").bind(id).first<PurchaseInvoiceRow>();
  if (!before) throw new Error("Invoice not found.");
  const pending = before.total - paid;
  await db.prepare("UPDATE purchase_invoices SET paid = ?, pending = ?, status = ? WHERE id = ?").bind(paid, pending, pending > 0 ? "open" : "paid", id).run();
  await writeAudit(db, "purchase_invoice", id, "update", changedBy, before, { paid, pending });
}

export async function voidPurchaseInvoice(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE purchase_invoices SET status = 'void' WHERE id = ?").bind(id).run();
  await writeAudit(db, "purchase_invoice", id, "void", changedBy, before, { status: "void" });
}

export async function purchaseInvoiceHtml(db: D1Database, id: string, env: Env) {
  const { invoice, items } = await purchaseInvoiceDetail(db, Number(id));
  if (!invoice) return html("Invoice not found", 404);
  const farmer = await db.prepare("SELECT phone, village, address, email, gst FROM farmers WHERE id = ?").bind(invoice.farmer_id).first<{ phone: string; village: string; address: string; email: string; gst: string }>();
  const business = await getBusinessDetails(db);
  const logoSrc = await logoDataUrl(env);
  const rows = items.map((item) => `<tr><td>${e(item.banana_type)} (${e(item.grade)})</td><td class="num">${e(item.units)}</td><td class="num">${e(item.gross_weight_kg)}</td><td class="num">${e(item.stem_reduction_per_unit)}</td><td class="num">${e(item.net_weight_kg)}</td><td class="num">${money(item.rate)}</td><td>${e(item.vehicle_no)}</td><td class="num">${money(item.amount)}</td></tr>`).join("");
  const voidBadge = invoice.status === "void" ? '<span class="badge" style="background:#fff0ee;border-color:#edc4bf;color:#b3463c">VOID</span>' : `<span class="badge">${e(invoice.status)}</span>`;
  const vehicles = Array.from(new Set(items.map((it) => it.vehicle_no).filter(Boolean)));
  return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>${INVOICE_STYLE}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet">
${invoiceHeaderHtml(business, logoSrc)}
<div class="billmeta"><span><strong>Purchase Invoice</strong> ${e(invoice.invoice_no)}</span><span>Date: <strong>${e(invoice.invoice_date)}</strong></span><span>Vehicle(s): <strong>${e(vehicles.join(", ") || "-")}</strong></span><span>${voidBadge}</span></div>
<section class="meta">
${partyBoxHtml("Farmer (Seller)", invoice.farmer_name, farmer?.phone || "", "Village", farmer?.village || "", farmer?.address || "", farmer?.email || "", farmer?.gst || "")}
<div class="box"><div class="label">Notes</div><div class="value" style="font-size:.9rem;font-weight:600">${e(invoice.notes || "-")}</div></div>
</section>
<table><thead><tr><th>Banana (grade)</th><th class="num">Units</th><th class="num">Gross kg</th><th class="num">Stem/unit</th><th class="num">Net kg</th><th class="num">Rate</th><th>Vehicle</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table>
<p class="words">${amountInWords(invoice.total)}</p>
<div class="footer-row">${signatureBlockHtml(business.name)}</div>
<p class="footer">Generated from ${e(business.name)} Desk.</p>
</main></body></html>`);
}

function purchaseInvoiceText(businessName: string, invoice: PurchaseInvoiceRow, items: PurchaseInvoiceItemRow[]) {
  return [
    `${businessName} - Purchase Invoice ${invoice.invoice_no}`,
    `Farmer: ${invoice.farmer_name}`,
    `Date: ${invoice.invoice_date}`,
    "",
    ...items.map((item) => `${item.banana_type} (${item.grade}) | ${item.net_weight_kg} kg @ ${money(item.rate)} = ${money(item.amount)} | ${item.vehicle_no}`),
    "",
    `Total: ${money(invoice.total)}`,
    `Paid: ${money(invoice.paid)}`,
    `Pending: ${money(invoice.pending)}`
  ].join("\n");
}

export async function sendPurchaseInvoice(db: D1Database, env: Env, id: number, origin: string) {
  const { invoice, items } = await purchaseInvoiceDetail(db, id);
  if (!invoice) throw new Error("Invoice not found.");
  const farmer = await db.prepare("SELECT email, phone FROM farmers WHERE id = ?").bind(invoice.farmer_id).first<{ email: string; phone: string }>();
  const business = await getBusinessDetails(db);
  const text = purchaseInvoiceText(business.name, invoice, items);
  const link = `${origin}/purchase-invoice/${invoice.id}`;
  const results: { email?: unknown; whatsapp?: unknown } = {};
  if (farmer?.email) {
    results.email = await sendEmail(env, [farmer.email], `Purchase invoice ${invoice.invoice_no}`, `${text}\n\nView/print: ${link}`);
  }
  if (farmer?.phone) {
    results.whatsapp = await sendWhatsAppTemplate(env, farmer.phone, "purchase_invoice_notice", [invoice.invoice_no, invoice.farmer_name, money(invoice.total), money(invoice.pending), link]);
  }
  return results;
}
