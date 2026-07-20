import { writeAudit } from "./audit";
import { all } from "./util";

export async function listFarmers(db: D1Database) {
  return all(
    db,
    `SELECT f.*, COALESCE(p.total, 0) AS purchase_total, COALESCE(pay.total, 0) AS paid_total,
            COALESCE(p.total, 0) - COALESCE(pay.total, 0) AS balance
     FROM farmers f
     LEFT JOIN (SELECT farmer_id, SUM(weight_kg * rate) AS total FROM purchases WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY farmer_id) p ON p.farmer_id = f.id
     LEFT JOIN (SELECT farmer_id, SUM(amount) AS total FROM farmer_payments WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY farmer_id) pay ON pay.farmer_id = f.id
     WHERE f.deleted_at = '' OR f.deleted_at IS NULL
     ORDER BY f.name`
  );
}

export async function listVendors(db: D1Database) {
  return all(
    db,
    `SELECT v.*, COALESCE(s.total, 0) AS sale_total, COALESCE(s.paid, 0) AS paid_total,
            COALESCE(s.total, 0) - COALESCE(s.paid, 0) AS balance
     FROM vendors v
     LEFT JOIN (SELECT vendor_id, SUM(weight_kg * rate) AS total, SUM(paid) AS paid FROM sales WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY vendor_id) s ON s.vendor_id = v.id
     WHERE v.deleted_at = '' OR v.deleted_at IS NULL
     ORDER BY v.name`
  );
}

export async function listVehicles(db: D1Database) {
  return all(db, "SELECT * FROM vehicles WHERE (deleted_at = '' OR deleted_at IS NULL) AND active = 1 ORDER BY vehicle_no");
}

export async function createFarmer(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO farmers (name, phone, village, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.notes || "").run();
  await writeAudit(db, "farmer", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function updateFarmer(db: D1Database, id: number, input: Record<string, unknown>, changedBy: string) {
  const before = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(id).first();
  await db.prepare(
    "UPDATE farmers SET name = ?, phone = ?, village = ?, address = ?, gst = ?, notes = ? WHERE id = ?"
  ).bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.notes || "", id).run();
  await writeAudit(db, "farmer", id, "update", changedBy, before, input);
}

export async function deleteFarmer(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE farmers SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "farmer", id, "delete", changedBy, before, null);
}

export async function createVendor(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const result = await db.prepare(
    "INSERT INTO vendors (name, phone, market, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.notes || "").run();
  await writeAudit(db, "vendor", result.meta.last_row_id, "create", changedBy, null, input);
}

export async function updateVendor(db: D1Database, id: number, input: Record<string, unknown>, changedBy: string) {
  const before = await db.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
  await db.prepare(
    "UPDATE vendors SET name = ?, phone = ?, market = ?, address = ?, gst = ?, notes = ? WHERE id = ?"
  ).bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.notes || "", id).run();
  await writeAudit(db, "vendor", id, "update", changedBy, before, input);
}

export async function deleteVendor(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE vendors SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "vendor", id, "delete", changedBy, before, null);
}

export async function createVehicle(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  await db.prepare(
    "INSERT INTO vehicles (vehicle_no, driver_name, phone, notes) VALUES (?, ?, ?, ?) ON CONFLICT(vehicle_no) DO UPDATE SET driver_name = excluded.driver_name, phone = excluded.phone, notes = excluded.notes, active = 1"
  ).bind(input.vehicle_no, input.driver_name || "", input.phone || "", input.notes || "").run();
  await writeAudit(db, "vehicle", 0, "create", changedBy, null, input);
}

export async function deleteVehicle(db: D1Database, id: number, changedBy: string) {
  const before = await db.prepare("SELECT * FROM vehicles WHERE id = ?").bind(id).first();
  await db.prepare("UPDATE vehicles SET active = 0, deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  await writeAudit(db, "vehicle", id, "delete", changedBy, before, null);
}

export async function createRate(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const before = await db.prepare("SELECT * FROM banana_rates WHERE rate_date = ? AND banana_type = ?").bind(input.rate_date, input.banana_type).first();
  await db.prepare(
    "INSERT INTO banana_rates (rate_date, banana_type, buy_rate, sell_rate) VALUES (?, ?, ?, ?) ON CONFLICT(rate_date, banana_type) DO UPDATE SET buy_rate = excluded.buy_rate, sell_rate = excluded.sell_rate"
  ).bind(input.rate_date, input.banana_type, Number(input.buy_rate), Number(input.sell_rate)).run();
  await writeAudit(db, "banana_rate", 0, before ? "update" : "create", changedBy, before, input);
}
