import { writeAudit } from "./audit";
import { all } from "./util";

export async function listTrips(db: D1Database, month?: string) {
  const monthLike = `${month || new Date().toISOString().slice(0, 7)}-%`;
  return all(
    db,
    `SELECT t.*,
            COALESCE(p.total, 0) AS purchase_total,
            COALESCE(s.total, 0) AS sale_total,
            COALESCE(x.total, 0) AS expense_total,
            COALESCE(s.total, 0) - COALESCE(p.total, 0) - COALESCE(x.total, 0) AS net_profit
     FROM vehicle_trips t
     LEFT JOIN (SELECT trip_id, SUM(weight_kg * rate) AS total FROM purchases WHERE trip_id IS NOT NULL AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY trip_id) p ON p.trip_id = t.id
     LEFT JOIN (SELECT trip_id, SUM(weight_kg * rate) AS total FROM sales WHERE trip_id IS NOT NULL AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY trip_id) s ON s.trip_id = t.id
     LEFT JOIN (SELECT trip_id, SUM(amount) AS total FROM trip_expenses WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY trip_id) x ON x.trip_id = t.id
     WHERE (t.deleted_at = '' OR t.deleted_at IS NULL) AND t.trip_date LIKE ?
     ORDER BY t.trip_date DESC, t.id DESC`,
    monthLike
  );
}

export async function listOpenTrips(db: D1Database) {
  return all(db, "SELECT id, trip_date, vehicle_no, driver_name FROM vehicle_trips WHERE status = 'open' AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY trip_date DESC, id DESC");
}

export async function tripDetail(db: D1Database, id: number) {
  const trip = await db.prepare("SELECT * FROM vehicle_trips WHERE id = ?").bind(id).first();
  const purchases = await all(db, "SELECT * FROM purchases WHERE trip_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", id);
  const sales = await all(db, "SELECT * FROM sales WHERE trip_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", id);
  const expenses = await all(db, "SELECT * FROM trip_expenses WHERE trip_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", id);
  return { trip, purchases, sales, expenses };
}

export async function createTrip(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO vehicle_trips (trip_date, vehicle_no, driver_name, notes) VALUES (?, ?, ?, ?)"
  ).bind(input.trip_date, input.vehicle_no, input.driver_name || "", input.notes || "").run();
  await writeAudit(db, "vehicle_trip", result.meta.last_row_id, "create", changedBy, null, input);
  return result.meta.last_row_id;
}

export async function settleTrip(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM vehicle_trips WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE vehicle_trips SET status = 'settled' WHERE id = ?").bind(id).run();
  await writeAudit(db, "vehicle_trip", id, "update", changedBy, before, { status: "settled" });
}

export async function deleteTrip(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM vehicle_trips WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE vehicle_trips SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "vehicle_trip", id, "delete", changedBy, before, null);
}

export async function addTripExpense(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO trip_expenses (trip_id, expense_type, amount, notes) VALUES (?, ?, ?, ?)"
  ).bind(Number(input.trip_id), String(input.expense_type || "other"), Number(input.amount), input.notes || "").run();
  await writeAudit(db, "trip_expense", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function deleteTripExpense(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM trip_expenses WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE trip_expenses SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "trip_expense", id, "delete", changedBy, before, null);
}
