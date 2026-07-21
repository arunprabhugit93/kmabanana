import { writeAudit } from "./audit";
import { all, netWeight } from "./util";

function purchaseFields(input: Record<string, unknown>) {
  const bunches = Number(input.bunches || 0);
  const stemReductionPerUnit = Number(input.stem_reduction_per_unit || 0);
  const grossWeightKg = Number(input.gross_weight_kg || input.weight_kg || 0);
  const weightKg = netWeight(grossWeightKg, bunches, stemReductionPerUnit);
  const grade = String(input.grade || "1st grade");
  return { bunches, stemReductionPerUnit, grossWeightKg, weightKg, grade };
}

export async function createPurchase(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first<{ name: string }>();
  const f = purchaseFields(input);
  const result = await db.prepare(
    "INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, grade, bunches, gross_weight_kg, stem_reduction_per_unit, weight_kg, rate, vehicle_no, notes, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    input.purchase_date,
    Number(input.farmer_id),
    farmer?.name || "Unknown farmer",
    input.banana_type,
    f.grade,
    f.bunches,
    f.grossWeightKg,
    f.stemReductionPerUnit,
    f.weightKg,
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
  const f = purchaseFields(input);
  await db.prepare(
    "UPDATE purchases SET purchase_date = ?, farmer_id = ?, farmer_name = ?, banana_type = ?, grade = ?, bunches = ?, gross_weight_kg = ?, stem_reduction_per_unit = ?, weight_kg = ?, rate = ?, vehicle_no = ?, notes = ?, trip_id = ? WHERE id = ?"
  ).bind(
    input.purchase_date,
    Number(input.farmer_id),
    farmer?.name || "Unknown farmer",
    input.banana_type,
    f.grade,
    f.bunches,
    f.grossWeightKg,
    f.stemReductionPerUnit,
    f.weightKg,
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
      netWeight(entry.weight_kg, entry.units, entry.stem_reduction_per_unit),
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

type CutterBatch = {
  id: number;
  status: string;
  batch_date: string;
  banana_type: string;
  farmer_id: number;
  farmer_name: string;
  vehicle_no: string;
};

async function requirePendingBatch(db: D1Database, batchId: number): Promise<CutterBatch> {
  const batch = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(batchId).first<CutterBatch>();
  if (!batch) throw new Error("Cutter batch not found.");
  if (batch.status !== "pending") throw new Error("This batch is already approved or rejected and can no longer be edited.");
  return batch;
}

export async function cutterBatchDetail(db: D1Database, id: number) {
  const batch = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(id).first();
  const entries = await all(db, "SELECT * FROM cutter_entries WHERE batch_id = ? ORDER BY id", id);
  return { batch, entries };
}

export async function updateCutterBatch(db: D1Database, id: number, input: Record<string, unknown>, changedBy: string) {
  const before = await requirePendingBatch(db, id);
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first<{ name: string }>();
  await db.prepare(
    "UPDATE cutter_batches SET batch_date = ?, farmer_id = ?, farmer_name = ?, banana_type = ?, vehicle_no = ? WHERE id = ?"
  ).bind(input.batch_date, Number(input.farmer_id), farmer?.name || "Unknown farmer", input.banana_type, input.vehicle_no, id).run();
  await writeAudit(db, "cutter_batch", id, "update", changedBy, before, input);
}

export async function addCutterEntry(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const batchId = Number(input.batch_id);
  await requirePendingBatch(db, batchId);
  const grossWeightKg = Number(input.gross_weight_kg || 0);
  const units = Number(input.units || 0);
  const stemReductionPerUnit = Number(input.stem_reduction_per_unit || 0);
  const result = await db.prepare(
    "INSERT INTO cutter_entries (batch_id, gross_weight_kg, units, stem_reduction_per_unit, net_weight_kg, grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(batchId, grossWeightKg, units, stemReductionPerUnit, netWeight(grossWeightKg, units, stemReductionPerUnit), input.grade || "1st grade", input.notes || "").run();
  await writeAudit(db, "cutter_entry", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function updateCutterEntry(db: D1Database, id: number, input: Record<string, unknown>, changedBy: string) {
  const before = await db.prepare("SELECT * FROM cutter_entries WHERE id = ?").bind(id).first<{ batch_id: number }>();
  if (!before) throw new Error("Cutter entry not found.");
  await requirePendingBatch(db, before.batch_id);
  const grossWeightKg = Number(input.gross_weight_kg || 0);
  const units = Number(input.units || 0);
  const stemReductionPerUnit = Number(input.stem_reduction_per_unit || 0);
  await db.prepare(
    "UPDATE cutter_entries SET gross_weight_kg = ?, units = ?, stem_reduction_per_unit = ?, net_weight_kg = ?, grade = ?, notes = ? WHERE id = ?"
  ).bind(grossWeightKg, units, stemReductionPerUnit, netWeight(grossWeightKg, units, stemReductionPerUnit), input.grade || "1st grade", input.notes || "", id).run();
  await writeAudit(db, "cutter_entry", id, "update", changedBy, before, input);
}

export async function deleteCutterEntry(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM cutter_entries WHERE id = ?").bind(id).first<{ batch_id: number }>();
  if (!before) throw new Error("Cutter entry not found.");
  await requirePendingBatch(db, before.batch_id);
  await db.prepare("DELETE FROM cutter_entries WHERE id = ?").bind(id).run();
  await writeAudit(db, "cutter_entry", id, "delete", changedBy, before, null);
}

export async function approveCutterBatch(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const id = Number(input.id);
  const batch = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(id).first<CutterBatch>();
  if (!batch) throw new Error("Batch not found");
  if (batch.status !== "pending") return id;

  const entries = await all(db, "SELECT * FROM cutter_entries WHERE batch_id = ? ORDER BY id", id) as Array<{
    grade: string;
    gross_weight_kg: number;
    units: number;
    stem_reduction_per_unit: number;
    net_weight_kg: number;
  }>;
  if (!entries.length) throw new Error("This batch has no weight lines to approve.");

  const rateCache = new Map<string, number>();
  for (const entry of entries) {
    if (!rateCache.has(entry.grade)) {
      const rate = await db.prepare("SELECT buy_rate FROM banana_rates WHERE rate_date = ? AND banana_type = ? AND grade = ?").bind(batch.batch_date, batch.banana_type, entry.grade).first<{ buy_rate: number }>();
      if (!rate) throw new Error(`Set the ${entry.grade} buy rate for ${batch.banana_type} on ${batch.batch_date} before approving.`);
      rateCache.set(entry.grade, Number(rate.buy_rate));
    }
  }

  for (const entry of entries) {
    const buyRate = rateCache.get(entry.grade) as number;
    const notes = `Cutter batch #${batch.id}`;
    await db.prepare(
      "INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, grade, bunches, gross_weight_kg, stem_reduction_per_unit, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(batch.batch_date, batch.farmer_id, batch.farmer_name, batch.banana_type, entry.grade, Number(entry.units), Number(entry.gross_weight_kg), Number(entry.stem_reduction_per_unit), Number(entry.net_weight_kg), buyRate, batch.vehicle_no, notes).run();
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
