import { writeAudit } from "./audit";
import { netWeight } from "./util";

function saleFields(input: Record<string, unknown>) {
  const bunches = Number(input.bunches || 0);
  const stemReductionPerUnit = Number(input.stem_reduction_per_unit || 0);
  const grossWeightKg = Number(input.gross_weight_kg || input.weight_kg || 0);
  const weightKg = netWeight(grossWeightKg, bunches, stemReductionPerUnit);
  const grade = String(input.grade || "1st grade");
  return { bunches, stemReductionPerUnit, grossWeightKg, weightKg, grade };
}

export async function createSale(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first<{ name: string }>();
  const f = saleFields(input);
  const result = await db.prepare(
    "INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, grade, bunches, gross_weight_kg, stem_reduction_per_unit, weight_kg, rate, paid, vehicle_no, notes, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    input.sale_date,
    Number(input.vendor_id),
    vendor?.name || "Unknown vendor",
    input.banana_type,
    f.grade,
    f.bunches,
    f.grossWeightKg,
    f.stemReductionPerUnit,
    f.weightKg,
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
  const f = saleFields(input);
  await db.prepare(
    "UPDATE sales SET sale_date = ?, vendor_id = ?, vendor_name = ?, banana_type = ?, grade = ?, bunches = ?, gross_weight_kg = ?, stem_reduction_per_unit = ?, weight_kg = ?, rate = ?, paid = ?, vehicle_no = ?, notes = ?, trip_id = ? WHERE id = ?"
  ).bind(
    input.sale_date,
    Number(input.vendor_id),
    vendor?.name || "Unknown vendor",
    input.banana_type,
    f.grade,
    f.bunches,
    f.grossWeightKg,
    f.stemReductionPerUnit,
    f.weightKg,
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
