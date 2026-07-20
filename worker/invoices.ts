import { writeAudit } from "./audit";
import { all, arrayBufferToBase64, e, html, money } from "./util";

interface InvoiceLineRow {
  id: number;
  item_date: string;
  banana_type: string;
  weight_kg: number;
  rate: number;
  paid: number;
  bunches?: number;
  vehicle_no: string;
  notes: string;
}

export async function generateInvoice(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const partyType = input.party_type === "vendor" ? "vendor" : "farmer";
  const partyId = Number(input.party_id);
  const fromDate = String(input.from_date);
  const toDate = String(input.to_date);

  const rows = (partyType === "vendor"
    ? await all(db, "SELECT id, sale_date AS item_date, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE vendor_id = ? AND sale_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY sale_date, id", partyId, fromDate, toDate)
    : await all(db, "SELECT id, purchase_date AS item_date, banana_type, weight_kg, rate, bunches, vehicle_no, notes, 0 AS paid FROM purchases WHERE farmer_id = ? AND purchase_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date, id", partyId, fromDate, toDate)) as InvoiceLineRow[];

  const party = partyType === "vendor"
    ? await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(partyId).first<{ name: string }>()
    : await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(partyId).first<{ name: string }>();

  const total = rows.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const paid = partyType === "vendor"
    ? rows.reduce((sum, row) => sum + Number(row.paid || 0), 0)
    : Number(
        (await db.prepare(
          "SELECT COALESCE(SUM(amount), 0) AS total FROM farmer_payments WHERE farmer_id = ? AND payment_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL)"
        ).bind(partyId, fromDate, toDate).first<{ total: number }>())?.total || 0
      );

  const invoiceNo = `${partyType === "vendor" ? "VEND" : "FARM"}-${Date.now()}`;
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const result = await db.prepare(
    "INSERT INTO invoices (invoice_no, party_type, party_id, party_name, from_date, to_date, invoice_date, total, paid, pending, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(invoiceNo, partyType, partyId, party?.name || "Unknown", fromDate, toDate, invoiceDate, total, paid, total - paid, total - paid > 0 ? "open" : "paid").run();
  const invoiceId = result.meta.last_row_id;

  for (const row of rows) {
    const amount = Number(row.weight_kg) * Number(row.rate);
    const descriptionParts = [
      row.banana_type,
      row.vehicle_no ? `Vehicle ${row.vehicle_no}` : "",
      partyType === "farmer" && row.bunches ? `Units ${row.bunches}` : "",
      row.notes || ""
    ].filter(Boolean);
    await db.prepare(
      "INSERT INTO invoice_items (invoice_id, item_type, source_id, item_date, description, quantity_kg, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(invoiceId, partyType === "vendor" ? "sale" : "purchase", row.id, row.item_date, descriptionParts.join(" | "), Number(row.weight_kg), Number(row.rate), amount).run();
  }

  await writeAudit(db, "invoice", invoiceId, "create", changedBy, null, { invoice_no: invoiceNo, party_type: partyType, party_id: partyId, total, paid });
  return invoiceId;
}

export async function voidInvoice(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE invoices SET status = 'void' WHERE id = ?").bind(id).run();
  await writeAudit(db, "invoice", id, "void", changedBy, before, { status: "void" });
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

async function invoiceLineDescription(db: D1Database, item: InvoiceItemRow) {
  if (item.item_type === "purchase") {
    const source = await db.prepare("SELECT banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE id = ?").bind(Number(item.source_id)).first<PurchaseRow>();
    if (source) {
      return [
        source.banana_type,
        source.vehicle_no ? `Vehicle ${source.vehicle_no}` : "",
        source.bunches ? `Units ${source.bunches}` : "",
        source.notes || ""
      ].filter(Boolean).join(" | ");
    }
  }
  if (item.item_type === "sale") {
    const source = await db.prepare("SELECT banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE id = ?").bind(Number(item.source_id)).first<SaleRow>();
    if (source) {
      return [
        source.banana_type,
        source.vehicle_no ? `Vehicle ${source.vehicle_no}` : "",
        source.notes || ""
      ].filter(Boolean).join(" | ");
    }
  }
  return item.description;
}

export async function invoiceHtml(db: D1Database, id: string, env: Env) {
  const invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(Number(id)).first<InvoiceRow>();
  if (!invoice) return html("Invoice not found", 404);
  const items = await all(db, "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_date, id", Number(id)) as InvoiceItemRow[];
  const logoSrc = await logoDataUrl(env);
  const rows = (await Promise.all(items.map(async (item) => {
    const description = await invoiceLineDescription(db, item);
    return `<tr><td>${e(item.item_date)}</td><td>${e(description)}</td><td class="num">${e(item.quantity_kg)}</td><td class="num">${money(item.rate)}</td><td class="num">${money(item.amount)}</td></tr>`;
  }))).join("");
  const voidBadge = invoice.status === "void" ? '<span class="badge" style="background:#fff0ee;border-color:#edc4bf;color:#b3463c">VOID</span>' : `<span class="badge">${e(invoice.status)}</span>`;
  return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>*{box-sizing:border-box}body{background:radial-gradient(circle at 85% 6%,rgba(255,205,49,.24),transparent 260px),#f4f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;margin:0;padding:28px}.sheet{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,255,255,.94)),radial-gradient(circle at 90% 12%,rgba(255,209,58,.22),transparent 280px);border:1px solid #dce3d8;margin:auto;max-width:920px;overflow:hidden;padding:34px;position:relative}.sheet:after{color:rgba(217,173,58,.08);content:"KMS BANANA";font-size:5rem;font-weight:900;position:absolute;right:-20px;top:44%;transform:rotate(-18deg);z-index:0}.sheet>*{position:relative;z-index:1}.actions{margin:0 auto 16px;max-width:920px}button{background:#2f6b43;border:0;border-radius:7px;color:#fff;font-weight:700;padding:10px 14px}.top{align-items:start;border-bottom:3px solid #2f6b43;display:grid;grid-template-columns:1fr auto;gap:24px;padding-bottom:22px}.brandrow{align-items:center;display:flex;gap:14px}.brandrow img{height:72px;object-fit:contain;width:150px}.brand{font-size:1.8rem;font-weight:900}.muted{color:#66736a}.badge{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:#184c2c;display:inline-block;font-size:.78rem;font-weight:800;margin-top:8px;padding:5px 10px;text-transform:uppercase}.meta{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px;margin:24px 0}.box{border:1px solid #dce3d8;border-radius:8px;padding:14px}.label{color:#66736a;font-size:.72rem;font-weight:800;text-transform:uppercase}.value{font-size:1rem;font-weight:800;margin-top:5px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e8ede4;padding:11px 9px;text-align:left}th{background:#f6f8f4;color:#66736a;font-size:.72rem;text-transform:uppercase}.num{text-align:right}.totals{margin-left:auto;margin-top:24px;width:340px}.totals td,.totals th{border:1px solid #dce3d8}.totals .due{background:#fff7df;font-size:1.05rem}.footer{border-top:1px solid #dce3d8;color:#66736a;font-size:.85rem;margin-top:34px;padding-top:14px}@media print{body{background:#fff;padding:0}.actions{display:none}.sheet{border:0;max-width:none;padding:20px}}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet"><section class="top"><div class="brandrow"><img src="${logoSrc}" alt="KMS Banana logo"><div><div class="brand">KMS Banana</div><p class="muted">Banana merchant purchase and sales billing</p></div></div><div><h1>Invoice</h1><p class="muted">${e(invoice.invoice_no)}</p>${voidBadge}</div></section><section class="meta"><div class="box"><div class="label">Party</div><div class="value">${e(invoice.party_name)}</div><p class="muted">${e(invoice.party_type)} invoice</p></div><div class="box"><div class="label">Invoice date</div><div class="value">${e(invoice.invoice_date)}</div></div><div class="box"><div class="label">Period</div><div class="value">${e(invoice.from_date)} to ${e(invoice.to_date)}</div></div></section><table><thead><tr><th>Date</th><th>Description</th><th class="num">Kg</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table><p class="footer">Generated from saved purchase and sales records in KMS Banana Desk.</p></main></body></html>`);
}
