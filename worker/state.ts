import type { AuthUser } from "./auth";
import { listStaff } from "./auth";
import { recentAudit } from "./audit";
import { listFarmers, listVendors, listVehicles } from "./masters";
import { listFarmerPayments } from "./payments";
import { stockReconciliation } from "./stock";
import { listTrips, listOpenTrips } from "./trips";
import { all, currentMonth } from "./util";

export async function getState(db: D1Database, url: URL, user: AuthUser) {
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const month = url.searchParams.get("month") || currentMonth();
  const monthLike = `${month}-%`;
  const weekStart = new Date(`${date}T00:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const week = weekStart.toISOString().slice(0, 10);

  const [
    farmers,
    vendors,
    vehicles,
    rates,
    purchases,
    sales,
    invoices,
    cutterBatches,
    activityLogs,
    settingsRows,
    emailLogs,
    farmerPayments,
    trips,
    openTrips,
    stock
  ] = await Promise.all([
    listFarmers(db),
    listVendors(db),
    listVehicles(db),
    all(db, "SELECT * FROM banana_rates WHERE rate_date >= ? ORDER BY rate_date DESC, banana_type", week),
    all(db, "SELECT * FROM purchases WHERE purchase_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date DESC, id DESC", monthLike),
    all(db, "SELECT * FROM sales WHERE sale_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY sale_date DESC, id DESC", monthLike),
    all(db, "SELECT * FROM invoices ORDER BY id DESC LIMIT 50"),
    all(db, "SELECT b.*, COUNT(e.id) AS entry_count, COALESCE(SUM(e.gross_weight_kg), 0) AS total_gross_kg, COALESCE(SUM(e.net_weight_kg), 0) AS total_net_kg FROM cutter_batches b LEFT JOIN cutter_entries e ON e.batch_id = b.id WHERE b.batch_date LIKE ? GROUP BY b.id ORDER BY b.id DESC", monthLike),
    all(db, "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 40"),
    all(db, "SELECT * FROM settings"),
    all(db, "SELECT * FROM email_logs ORDER BY id DESC LIMIT 20"),
    listFarmerPayments(db),
    listTrips(db, month),
    listOpenTrips(db),
    stockReconciliation(db, `${month}-01`, `${month}-31`)
  ]);

  const settings = Object.fromEntries((settingsRows as Array<{ key: string; value: string }>).map((row) => [row.key, row.value]));
  const staff = user.role === "owner" ? await listStaff(db) : [];
  const auditLogs = user.role === "owner" ? await recentAudit(db) : [];

  return {
    date,
    month,
    farmers,
    vendors,
    vehicles,
    rates,
    purchases,
    sales,
    invoices,
    cutterBatches,
    activityLogs,
    settings,
    emailLogs,
    farmerPayments,
    trips,
    openTrips,
    stock,
    staff,
    auditLogs,
    me: user
  };
}
