import { writeAudit } from "./audit";
import { createBananaType, createFarmer, createVehicle, createVendor } from "./masters";
import { all, toCsv } from "./util";

const TEMPLATES: Record<string, string[]> = {
  farmers: ["name", "phone", "email", "village", "address", "gst", "notes"],
  vendors: ["name", "phone", "email", "market", "address", "gst", "notes"],
  vehicles: ["vehicle_no", "driver_name", "phone", "notes"],
  "banana-types": ["name"]
};

export function mastersTemplate(type: string): string[] {
  return TEMPLATES[type] || TEMPLATES.farmers;
}

export async function exportMaster(db: D1Database, type: string) {
  if (type === "vendors") return toCsv(TEMPLATES.vendors, await all(db, "SELECT name, phone, email, market, address, gst, notes FROM vendors WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name") as Record<string, unknown>[]);
  if (type === "vehicles") return toCsv(TEMPLATES.vehicles, await all(db, "SELECT vehicle_no, driver_name, phone, notes FROM vehicles WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY vehicle_no") as Record<string, unknown>[]);
  if (type === "banana-types") return toCsv(TEMPLATES["banana-types"], await all(db, "SELECT name FROM banana_types WHERE active = 1 ORDER BY name") as Record<string, unknown>[]);
  return toCsv(TEMPLATES.farmers, await all(db, "SELECT name, phone, email, village, address, gst, notes FROM farmers WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name") as Record<string, unknown>[]);
}

export async function importMaster(db: D1Database, type: string, rows: Record<string, unknown>[], changedBy: string) {
  let count = 0;
  for (const row of rows) {
    if (type === "farmers" && row.name) { await createFarmer(db, row, changedBy); count++; }
    else if (type === "vendors" && row.name) { await createVendor(db, row, changedBy); count++; }
    else if (type === "vehicles" && row.vehicle_no) { await createVehicle(db, row, changedBy); count++; }
    else if (type === "banana-types" && row.name) { await createBananaType(db, row, changedBy); count++; }
  }
  await writeAudit(db, "master_import", 0, "create", changedBy, null, { type, count });
  return count;
}
