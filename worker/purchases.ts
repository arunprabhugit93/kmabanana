import { writeAudit } from "./audit";
import { all } from "./util";

export async function createPurchase(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first<{ name: string }>();
  const result = await db.prepare(
    "INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    input.purchase_date,
    Number(input.farmer_id),
    farmer?.name || "Unknown farmer",
    input.banana_type,
    Number(input.bunches || 0),
    Number(input.weight_kg),
    Number(input.rate),
    input.vehicle_no,
    input.notes || "",
    input.trip_id ? Number(input.trip_id) : null
  ).run();
  await writeAudit(db, "purchase", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function updatePurchase(db: D1Database, id: number, input: Record<string, unknown>, changedBy: string) {
  const before = await db.prepare("SELECT * FROM purchases WHERE id = ?").bind(id).first();
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first<{ name: string }>();
  await db.prepare(
    "UPDATE purchases SET purchase_date = ?, farmer_id = ?, farmer_name = ?, banana_type = ?, bunches = ?, weight_kg = ?, rate = ?, vehicle_no = ?, notes = ?, trip_id = ? WHERE id = ?"
  ).bind(
    input.purchase_date,
    Number(input.farmer_id),
    farmer?.name || "Unknown farmer",
    input.banana_type,
    Number(input.bunches || 0),
    Number(input.weight_kg),
    Number(input.rate),
    input.vehicle_no,
    input.notes || "",
    input.trip_id ? Number(input.trip_id) : null,
    id
  ).run();
  await writeAudit(db, "purchase", id, "update", changedBy, before, input);
}

export async function deletePurchase(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM purchases WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE purchases SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "purchase", id, "delete", changedBy, before, null);
}

function netWeight(entry: { weight_kg: unknown; units: unknown; stem_reduction_per_unit: unknown }) {
  return Math.max(0, Number(entry.weight_kg || 0) - Number(entry.units || 0) * Number(entry.stem_reduction_per_unit || 0));
}

export async function submitCutterBatch(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first<{ name: string }>();
  const farmerName = farmer?.name || "Unknown farmer";
  const result = await db.prepare(
    "INSERT INTO cutter_batches (batch_date, farmer_id, farmer_name, banana_type, vehicle_no, submitted_by, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')"
  ).bind(input.batch_date, Number(input.farmer_id), farmerName, input.banana_type, input.vehicle_no, input.submitted_by || "").run();
  const batchId = result.meta.last_row_id;
  const entries = Array.isArray(input.entries) ? (input.entries as Record<string, unknown>[]) : [];
  for (const entry of entries) {
    await db.prepare(
      "INSERT INTO cutter_entries (batch_id, gross_weight_kg, units, stem_reduction_per_unit, net_weight_kg, grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      batchId,
      Number(entry.weight_kg),
      Number(entry.units),
      Number(entry.stem_reduction_per_unit || 0),
      netWeight(entry as { weight_kg: unknown; units: unknown; stem_reduction_per_unit: unknown }),
      entry.grade || "1st grade",
      entry.notes || ""
    ).run();
  }
  await db.prepare(
    "INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)"
  ).bind("cutter_batch", batchId, "pending", `Cutter batch submitted by ${input.submitted_by || "cutter"} for ${farmerName}`).run();
  await writeAudit(db, "cutter_batch", batchId, "create", changedBy, null, input);
  return batchId;
}

export async function approveCutterBatch(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const id = Number(input.id);
  const batch = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(id).first<{
    id: number;
    status: string;
    batch_date: string;
    banana_type: string;
    farmer_id: number;
    farmer_name: string;
    vehicle_no: string;
  }>();
  if (!batch) throw new Error("Batch not found");
  if (batch.status !== "pending") return id;

  const rate = await db.prepare("SELECT buy_rate FROM banana_rates WHERE rate_date = ? AND banana_type = ?").bind(batch.batch_date, batch.banana_type).first<{ buy_rate: number }>();
  const buyRate = Number(rate?.buy_rate || 0);
  const entries = await all(db, "SELECT * FROM cutter_entries WHERE batch_id = ? ORDER BY id", id) as Array<{
    grade: string;
    gross_weight_kg: number;
    units: number;
    stem_reduction_per_unit: number;
    net_weight_kg: number;
  }>;
  for (const entry of entries) {
    const notes = `Cutter batch #${batch.id}; ${entry.grade}; gross ${entry.gross_weight_kg} kg; units ${entry.units}; stem reduction ${entry.stem_reduction_per_unit}/unit`;
    await db.prepare(
      "INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(batch.batch_date, batch.farmer_id, batch.farmer_name, batch.banana_type, Number(entry.units), Number(entry.net_weight_kg), buyRate, batch.vehicle_no, notes).run();
  }
  await db.prepare("UPDATE cutter_batches SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?").bind(changedBy || "Admin", id).run();
  await db.prepare(
    "INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)"
  ).bind("cutter_batch", id, "approved", `Cutter batch approved and converted to ${entries.length} purchase entries`).run();
  await writeAudit(db, "cutter_batch", id, "approve", changedBy, batch, { status: "approved" });
  return id;
}

export async function rejectCutterBatch(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const id = Number(input.id);
  const before = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE cutter_batches SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ? AND status = 'pending'").bind(changedBy || "Admin", id).run();
  await db.prepare(
    "INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)"
  ).bind("cutter_batch", id, "rejected", "Cutter batch rejected").run();
  await writeAudit(db, "cutter_batch", id, "reject", changedBy, before, { status: "rejected" });
}
