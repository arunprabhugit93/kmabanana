import { writeAudit } from "./audit";
import { all, toCsv } from "./util";
import { createFarmer, createVendor, createVehicle } from "./masters";

export async function importRows(db: D1Database, input: Record<string, unknown>, changedBy: string) {
  const rows = Array.isArray(input.rows) ? (input.rows as Record<string, unknown>[]) : [];
  let count = 0;
  for (const row of rows) {
    if (input.type === "farmers" && row.name) {
      await createFarmer(db, row, changedBy);
      count++;
    } else if (input.type === "vendors" && row.name) {
      await createVendor(db, row, changedBy);
      count++;
    } else if (input.type === "vehicles" && row.vehicle_no) {
      await createVehicle(db, row, changedBy);
      count++;
    } else if (input.type === "purchases" && row.purchase_date) {
      const result = await db.prepare(
        "INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(row.purchase_date, Number(row.farmer_id || 0) || null, row.farmer_name || "", row.banana_type, Number(row.bunches || 0), Number(row.weight_kg), Number(row.rate), row.vehicle_no || "", row.notes || "").run();
      await writeAudit(db, "purchase", result.meta.last_row_id, "create", changedBy, null, row);
      count++;
    } else if (input.type === "sales" && row.sale_date) {
      const result = await db.prepare(
        "INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(row.sale_date, Number(row.vendor_id || 0) || null, row.vendor_name || "", row.banana_type, Number(row.weight_kg), Number(row.rate), Number(row.paid || 0), row.vehicle_no || "", row.notes || "").run();
      await writeAudit(db, "sale", result.meta.last_row_id, "create", changedBy, null, row);
      count++;
    }
  }
  return count;
}

export function template(type: string): string[] {
  const templates: Record<string, string[]> = {
    farmers: ["name", "phone", "village", "address", "gst", "notes"],
    vendors: ["name", "phone", "market", "address", "gst", "notes"],
    vehicles: ["vehicle_no", "driver_name", "phone", "notes"],
    purchases: ["purchase_date", "farmer_id", "farmer_name", "banana_type", "bunches", "weight_kg", "rate", "vehicle_no", "notes"],
    sales: ["sale_date", "vendor_id", "vendor_name", "banana_type", "weight_kg", "rate", "paid", "vehicle_no", "notes"]
  };
  return templates[type] || templates.farmers;
}

export async function exportData(db: D1Database, type: string, month: string) {
  if (type === "farmers") return toCsv(template(type), await all(db, "SELECT name, phone, village, address, gst, notes FROM farmers WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name") as Record<string, unknown>[]);
  if (type === "vendors") return toCsv(template(type), await all(db, "SELECT name, phone, market, address, gst, notes FROM vendors WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name") as Record<string, unknown>[]);
  if (type === "vehicles") return toCsv(template(type), await all(db, "SELECT vehicle_no, driver_name, phone, notes FROM vehicles WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY vehicle_no") as Record<string, unknown>[]);
  if (type === "sales") return toCsv(template(type), await all(db, "SELECT sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE sale_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY sale_date, id", `${month}-%`) as Record<string, unknown>[]);
  return toCsv(template("purchases"), await all(db, "SELECT purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE purchase_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date, id", `${month}-%`) as Record<string, unknown>[]);
}
