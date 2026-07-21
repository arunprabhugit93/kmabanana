import type { AuthUser } from "./auth";
import { listStaff } from "./auth";
import { recentAudit } from "./audit";
import { listBananaTypes, listFarmers, listVendors, listVehicles } from "./masters";
import { listPurchaseInvoices } from "./purchaseInvoices";
import { listSaleInvoices } from "./saleInvoices";
import { all, currentMonth, today } from "./util";

export async function getState(db: D1Database, url: URL, user: AuthUser) {
  const month = url.searchParams.get("month") || currentMonth();
  const weekStart = new Date(`${today()}T00:00:00`);
  weekStart.setDate(weekStart.getDate() - 13);
  const week = weekStart.toISOString().slice(0, 10);

  const [
    farmers,
    vendors,
    vehicles,
    bananaTypes,
    rates,
    purchaseInvoices,
    saleInvoices,
    settingsRows,
    emailLogs
  ] = await Promise.all([
    listFarmers(db),
    listVendors(db),
    listVehicles(db),
    listBananaTypes(db),
    all(db, "SELECT * FROM banana_rates WHERE rate_date >= ? ORDER BY rate_date DESC, banana_type", week),
    listPurchaseInvoices(db, month),
    listSaleInvoices(db, month),
    all(db, "SELECT * FROM settings"),
    all(db, "SELECT * FROM email_logs ORDER BY id DESC LIMIT 20")
  ]);

  const settings = Object.fromEntries((settingsRows as Array<{ key: string; value: string }>).map((row) => [row.key, row.value]));
  const staff = user.role === "owner" ? await listStaff(db) : [];
  const auditLogs = user.role === "owner" ? await recentAudit(db) : [];

  return {
    month,
    farmers,
    vendors,
    vehicles,
    bananaTypes,
    rates,
    purchaseInvoices,
    saleInvoices,
    settings,
    emailLogs,
    staff,
    auditLogs,
    me: user
  };
}
