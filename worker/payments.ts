import { writeAudit } from "./audit";
import { all } from "./util";

export async function listFarmerPayments(db: D1Database, farmerId?: number) {
  if (farmerId) {
    return all(
      db,
      "SELECT p.*, f.name AS farmer_name FROM farmer_payments p JOIN farmers f ON f.id = p.farmer_id WHERE p.farmer_id = ? AND (p.deleted_at = '' OR p.deleted_at IS NULL) ORDER BY p.payment_date DESC, p.id DESC",
      farmerId
    );
  }
  return all(
    db,
    "SELECT p.*, f.name AS farmer_name FROM farmer_payments p JOIN farmers f ON f.id = p.farmer_id WHERE p.deleted_at = '' OR p.deleted_at IS NULL ORDER BY p.payment_date DESC, p.id DESC LIMIT 200"
  );
}

export async function farmerLedger(db: D1Database, farmerId: number) {
  const purchases = await all(
    db,
    "SELECT id, purchase_date AS date, banana_type, weight_kg, rate, (weight_kg * rate) AS amount, vehicle_no FROM purchases WHERE farmer_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date, id",
    farmerId
  );
  const payments = await all(
    db,
    "SELECT id, payment_date AS date, amount, mode, notes FROM farmer_payments WHERE farmer_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY payment_date, id",
    farmerId
  );
  return { purchases, payments };
}

export async function createFarmerPayment(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO farmer_payments (payment_date, farmer_id, amount, mode, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    input.payment_date,
    Number(input.farmer_id),
    Number(input.amount),
    String(input.mode || "cash"),
    input.notes || "",
    changedBy
  ).run();
  await writeAudit(db, "farmer_payment", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function deleteFarmerPayment(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM farmer_payments WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE farmer_payments SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "farmer_payment", id, "delete", changedBy, before, null);
}
