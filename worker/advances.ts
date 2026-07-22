import { writeAudit } from "./audit";
import { all } from "./util";

export async function createFarmerAdvance(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO farmer_payments (payment_date, farmer_id, amount, mode, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(input.advance_date, Number(input.farmer_id), Number(input.amount), String(input.mode || "cash"), input.notes || "", changedBy).run();
  await writeAudit(db, "farmer_advance", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function deleteFarmerAdvance(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM farmer_payments WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE farmer_payments SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "farmer_advance", id, "delete", changedBy, before, null);
}

export async function createVendorAdvance(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO vendor_advances (advance_date, vendor_id, amount, mode, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(input.advance_date, Number(input.vendor_id), Number(input.amount), String(input.mode || "cash"), input.notes || "", changedBy).run();
  await writeAudit(db, "vendor_advance", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function deleteVendorAdvance(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM vendor_advances WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE vendor_advances SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "vendor_advance", id, "delete", changedBy, before, null);
}

export async function farmerPortfolio(db: D1Database, farmerId: number) {
  const farmer = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(farmerId).first<FarmerRow>();
  const invoices = await all(
    db,
    "SELECT * FROM purchase_invoices WHERE farmer_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY invoice_date DESC, id DESC",
    farmerId
  ) as PurchaseInvoiceRow[];
  const advances = await all(
    db,
    "SELECT id, payment_date AS advance_date, amount, mode, notes FROM farmer_payments WHERE farmer_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY payment_date DESC, id DESC",
    farmerId
  );
  const kgRow = await db.prepare(
    `SELECT COALESCE(SUM(pi.net_weight_kg), 0) AS kg FROM purchase_invoice_items pi
     JOIN purchase_invoices p ON p.id = pi.invoice_id
     WHERE p.farmer_id = ? AND p.status != 'void' AND (p.deleted_at = '' OR p.deleted_at IS NULL)`
  ).bind(farmerId).first<{ kg: number }>();

  const activeInvoices = invoices.filter((inv) => inv.status !== "void");
  const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = activeInvoices.reduce((sum, inv) => sum + inv.pending, 0);
  const totalAdvance = (advances as Array<{ amount: number }>).reduce((sum, a) => sum + Number(a.amount), 0);

  return {
    farmer,
    invoices,
    advances,
    totalInvoiced,
    totalPending,
    totalAdvance,
    netBalance: totalPending - totalAdvance,
    totalKg: Number(kgRow?.kg || 0),
    invoiceCount: activeInvoices.length
  };
}

export async function vendorPortfolio(db: D1Database, vendorId: number) {
  const vendor = await db.prepare("SELECT * FROM vendors WHERE id = ?").bind(vendorId).first<VendorRow>();
  const invoices = await all(
    db,
    "SELECT * FROM sale_invoices WHERE vendor_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY invoice_date DESC, id DESC",
    vendorId
  ) as SaleInvoiceRow[];
  const advances = await all(
    db,
    "SELECT id, advance_date, amount, mode, notes FROM vendor_advances WHERE vendor_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY advance_date DESC, id DESC",
    vendorId
  );
  const kgRow = await db.prepare(
    `SELECT COALESCE(SUM(si.net_weight_kg), 0) AS kg FROM sale_invoice_items si
     JOIN sale_invoices s ON s.id = si.invoice_id
     WHERE s.vendor_id = ? AND s.status != 'void' AND (s.deleted_at = '' OR s.deleted_at IS NULL)`
  ).bind(vendorId).first<{ kg: number }>();

  const activeInvoices = invoices.filter((inv) => inv.status !== "void");
  const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = activeInvoices.reduce((sum, inv) => sum + inv.pending, 0);
  const totalAdvance = (advances as Array<{ amount: number }>).reduce((sum, a) => sum + Number(a.amount), 0);

  return {
    vendor,
    invoices,
    advances,
    totalInvoiced,
    totalPending,
    totalAdvance,
    netBalance: totalPending - totalAdvance,
    totalKg: Number(kgRow?.kg || 0),
    invoiceCount: activeInvoices.length
  };
}
