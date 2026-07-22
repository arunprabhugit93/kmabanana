import { createStaff, currentUser, listStaff, logout, requestOtp, requireRole, setStaffActive, verifyOtp } from "./auth";
import {
  createBananaType,
  createFarmer,
  createRate,
  createVehicle,
  createVendor,
  deleteBananaType,
  deleteFarmer,
  deleteVehicle,
  deleteVendor,
  updateFarmer,
  updateVendor
} from "./masters";
import {
  createPurchaseInvoice,
  purchaseInvoiceDetail,
  purchaseInvoiceHtml,
  sendPurchaseInvoice,
  updatePurchaseInvoicePaid,
  voidPurchaseInvoice
} from "./purchaseInvoices";
import {
  createSaleInvoice,
  saleInvoiceDetail,
  saleInvoiceHtml,
  sendSaleInvoice,
  updateSaleInvoicePaid,
  vehicleLoadAvailable,
  voidSaleInvoice
} from "./saleInvoices";
import { periodReport, runScheduledReports, sendPeriodReport } from "./reports";
import { ensureDb } from "./schema";
import { getState } from "./state";
import { appShell } from "./views/shell";
import { exportMaster, importMaster, mastersTemplate } from "./mastersImportExport";
import { BUSINESS_SETTING_KEYS } from "./invoiceBranding";
import { bodyJson, csv, html, json } from "./util";

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  try {
    return await handleApiRoute(request, env, url);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Something went wrong." }, 400);
  }
}

async function handleApiRoute(request: Request, env: Env, url: URL): Promise<Response> {
  const db = env.DB;
  if (!db) return json({ error: "D1 database binding is missing." }, 500);
  await ensureDb(db);
  const input = request.method === "POST" ? await bodyJson(request) : {};

  if (url.pathname === "/api/auth/me") {
    const user = await currentUser(db, request);
    return json({ authenticated: Boolean(user), user });
  }
  if (url.pathname === "/api/auth/request") return requestOtp(db, env, input);
  if (url.pathname === "/api/auth/verify") return verifyOtp(db, input);
  if (url.pathname === "/api/auth/logout") return logout(db, request);

  const user = await currentUser(db, request);
  if (!user) return json({ error: "Login required" }, 401);
  const by = user.email;

  if (url.pathname === "/api/state") return json(await getState(db, url, user));

  // Masters — owner + staff
  if (url.pathname === "/api/farmers") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createFarmer(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/farmers/update") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await updateFarmer(db, Number(input.id), input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/farmers/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteFarmer(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/vendors") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createVendor(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/vendors/update") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await updateVendor(db, Number(input.id), input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/vendors/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteVendor(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/vehicles") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createVehicle(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/vehicles/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteVehicle(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/banana-types") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createBananaType(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/banana-types/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteBananaType(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/rates") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createRate(db, input, by); return json({ ok: true });
  }

  // Masters bulk import/export — owner + staff
  if (url.pathname === "/api/masters/template") {
    const type = url.searchParams.get("type") || "farmers";
    return csv(mastersTemplate(type).join(",") + "\n", `${type}-template.csv`);
  }
  if (url.pathname === "/api/masters/export") {
    const type = url.searchParams.get("type") || "farmers";
    return csv(await exportMaster(db, type), `${type}.csv`);
  }
  if (url.pathname === "/api/masters/import") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    const type = String(input.type || "farmers");
    const rows = Array.isArray(input.rows) ? (input.rows as Record<string, unknown>[]) : [];
    return json({ count: await importMaster(db, type, rows, by) });
  }

  // Purchase invoices — owner + staff
  if (url.pathname === "/api/purchase-invoices/create") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json({ id: await createPurchaseInvoice(db, input, by) });
  }
  if (url.pathname === "/api/purchase-invoices/detail") {
    return json(await purchaseInvoiceDetail(db, Number(url.searchParams.get("id") || 0)));
  }
  if (url.pathname === "/api/purchase-invoices/paid") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await updatePurchaseInvoicePaid(db, Number(input.id), Number(input.paid || 0), by); return json({ ok: true });
  }
  if (url.pathname === "/api/purchase-invoices/void") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    await voidPurchaseInvoice(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/purchase-invoices/send") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json(await sendPurchaseInvoice(db, env, Number(input.id), url.origin));
  }

  // Sale invoices — owner + staff
  if (url.pathname === "/api/sale-invoices/vehicle-load") {
    const vehicleNo = url.searchParams.get("vehicle_no") || "";
    const date = url.searchParams.get("date") || "";
    return json(await vehicleLoadAvailable(db, vehicleNo, date));
  }
  if (url.pathname === "/api/sale-invoices/create") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json({ id: await createSaleInvoice(db, input, by) });
  }
  if (url.pathname === "/api/sale-invoices/detail") {
    return json(await saleInvoiceDetail(db, Number(url.searchParams.get("id") || 0)));
  }
  if (url.pathname === "/api/sale-invoices/paid") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await updateSaleInvoicePaid(db, Number(input.id), Number(input.paid || 0), by); return json({ ok: true });
  }
  if (url.pathname === "/api/sale-invoices/void") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    await voidSaleInvoice(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/sale-invoices/send") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json(await sendSaleInvoice(db, env, Number(input.id), url.origin));
  }

  // Staff management — owner only
  if (url.pathname === "/api/staff") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    await createStaff(db, input); return json({ ok: true, staff: await listStaff(db) });
  }
  if (url.pathname === "/api/staff/toggle") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    await setStaffActive(db, Number(input.id), Boolean(input.active)); return json({ ok: true });
  }

  // Reports — owner + staff
  if (url.pathname === "/api/reports/period") {
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    return json({ rows: await periodReport(db, from, to) });
  }
  if (url.pathname === "/api/reports/send") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    const period = String(input.period || "Daily") as "Daily" | "Weekly" | "Monthly";
    return json(await sendPeriodReport(db, env, period, String(input.from), String(input.to)));
  }
  if (url.pathname === "/api/settings") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    const keys = ["daily_email_recipients", "weekly_email_recipients", "monthly_email_recipients", "whatsapp_numbers", ...BUSINESS_SETTING_KEYS];
    for (const key of keys) {
      await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, input[key] || "").run();
    }
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/logo.png" && env.ASSETS) return env.ASSETS.fetch(request);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (url.pathname.startsWith("/purchase-invoice/") || url.pathname.startsWith("/sale-invoice/")) {
      if (!env.DB) return html("D1 database binding is missing.", 500);
      await ensureDb(env.DB);
      const user = await currentUser(env.DB, request);
      if (!user) return html('<!doctype html><html><head><meta charset="utf-8"><title>Login required</title></head><body><p>Login required. Open the KMS Banana Desk and verify your email OTP before printing invoices.</p></body></html>', 401);
      const id = url.pathname.split("/").pop() as string;
      return url.pathname.startsWith("/purchase-invoice/") ? purchaseInvoiceHtml(env.DB, id, env) : saleInvoiceHtml(env.DB, id, env);
    }
    return html(appShell());
  },
  async scheduled(_event: unknown, env: Env): Promise<void> {
    if (!env.DB) return;
    await ensureDb(env.DB);
    await runScheduledReports(env.DB, env);
  }
};

export default worker;
