import { writeAudit } from "./audit";

export async function createSale(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first<{ name: string }>();
  const result = await db.prepare(
    "INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    input.sale_date,
    Number(input.vendor_id),
    vendor?.name || "Unknown vendor",
    input.banana_type,
    Number(input.weight_kg),
    Number(input.rate),
    Number(input.paid || 0),
    input.vehicle_no,
    input.notes || "",
    input.trip_id ? Number(input.trip_id) : null
  ).run();
  await writeAudit(db, "sale", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function updateSale(db: D1Database, id: number, input: Record<string, unknown>, changedBy: string) {
  const before = await db.prepare("SELECT * FROM sales WHERE id = ?").bind(id).first();
  const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first<{ name: string }>();
  await db.prepare(
    "UPDATE sales SET sale_date = ?, vendor_id = ?, vendor_name = ?, banana_type = ?, weight_kg = ?, rate = ?, paid = ?, vehicle_no = ?, notes = ?, trip_id = ? WHERE id = ?"
  ).bind(
    input.sale_date,
    Number(input.vendor_id),
    vendor?.name || "Unknown vendor",
    input.banana_type,
    Number(input.weight_kg),
    Number(input.rate),
    Number(input.paid || 0),
    input.vehicle_no,
    input.notes || "",
    input.trip_id ? Number(input.trip_id) : null,
    id
  ).run();
  await writeAudit(db, "sale", id, "update", changedBy, before, input);
}

export async function deleteSale(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM sales WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE sales SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "sale", id, "delete", changedBy, before, null);
}
