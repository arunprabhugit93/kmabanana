import { currentUser, listStaff, logout, requestOtp, requireRole, setStaffActive, verifyOtp, createStaff } from "./auth";
import { appShell } from "./views/shell";
import { invoiceHtml, generateInvoice, voidInvoice } from "./invoices";
import { createFarmer, createRate, createVehicle, createVendor, deleteFarmer, deleteVehicle, deleteVendor, updateFarmer, updateVendor } from "./masters";
import { createFarmerPayment, deleteFarmerPayment, farmerLedger } from "./payments";
import { approveCutterBatch, createPurchase, deletePurchase, rejectCutterBatch, submitCutterBatch, updatePurchase } from "./purchases";
import { createSale, deleteSale, updateSale } from "./sales";
import { dailyReport, sendDailyEmail } from "./reports";
import { ensureDb } from "./schema";
import { getState } from "./state";
import { addTripExpense, createTrip, deleteTrip, deleteTripExpense, settleTrip, tripDetail } from "./trips";
import { exportData, importRows, template } from "./importExport";
import { bodyJson, csv, html, json } from "./util";

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
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
  if (url.pathname === "/api/rates") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createRate(db, input, by); return json({ ok: true });
  }

  // Purchases / sales — owner + staff
  if (url.pathname === "/api/purchases") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createPurchase(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/purchases/update") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await updatePurchase(db, Number(input.id), input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/purchases/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deletePurchase(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/sales") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createSale(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/sales/update") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await updateSale(db, Number(input.id), input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/sales/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteSale(db, Number(input.id), by); return json({ ok: true });
  }

  // Cutter workflow — submit allowed for everyone logged in (incl. cutter role); approve/reject owner+staff
  if (url.pathname === "/api/cutter/submit") return json({ id: await submitCutterBatch(db, input, by) });
  if (url.pathname === "/api/cutter/approve") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json({ id: await approveCutterBatch(db, input, by) });
  }
  if (url.pathname === "/api/cutter/reject") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await rejectCutterBatch(db, input, by); return json({ ok: true });
  }

  // Farmer payment ledger — owner + staff
  if (url.pathname === "/api/farmer-payments") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await createFarmerPayment(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/farmer-payments/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteFarmerPayment(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/farmer-ledger") {
    const farmerId = Number(url.searchParams.get("farmer_id") || 0);
    return json(await farmerLedger(db, farmerId));
  }

  // Vehicle trips — owner + staff
  if (url.pathname === "/api/trips") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json({ id: await createTrip(db, input, by) });
  }
  if (url.pathname === "/api/trips/settle") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await settleTrip(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/trips/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteTrip(db, Number(input.id), by); return json({ ok: true });
  }
  if (url.pathname === "/api/trip-detail") {
    return json(await tripDetail(db, Number(url.searchParams.get("id") || 0)));
  }
  if (url.pathname === "/api/trip-expenses") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await addTripExpense(db, input, by); return json({ ok: true });
  }
  if (url.pathname === "/api/trip-expenses/delete") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    await deleteTripExpense(db, Number(input.id), by); return json({ ok: true });
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

  // Import / export — owner + staff
  if (url.pathname === "/api/import") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json({ count: await importRows(db, input, by) });
  }
  if (url.pathname === "/api/template") {
    const type = url.searchParams.get("type") || "farmers";
    return csv(template(type).join(",") + "\n", `${type}-template.csv`);
  }
  if (url.pathname === "/api/export") {
    const type = url.searchParams.get("type") || "purchases";
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
    return csv(await exportData(db, type, month), `${type}-${month}.csv`);
  }

  // Invoices — owner + staff generate; void owner only
  if (url.pathname === "/api/invoices/generate") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json({ id: await generateInvoice(db, input, by) });
  }
  if (url.pathname === "/api/invoices/void") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    await voidInvoice(db, Number(input.id), by); return json({ ok: true });
  }

  // Settings / reports — settings save is owner only, sending the report is owner + staff
  if (url.pathname === "/api/settings") {
    const denied = requireRole(user, ["owner"]); if (denied) return denied;
    await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("daily_email_recipients", input.daily_email_recipients || "").run();
    await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("daily_email_time", input.daily_email_time || "19:00").run();
    return json({ ok: true });
  }
  if (url.pathname === "/api/email/send-daily") {
    const denied = requireRole(user, ["owner", "staff"]); if (denied) return denied;
    return json(await sendDailyEmail(db, env, String(input.report_date || new Date().toISOString().slice(0, 10))));
  }
  if (url.pathname === "/api/reports/daily-text") {
    return json({ text: await dailyReport(db, url.searchParams.get("date") || new Date().toISOString().slice(0, 10)) });
  }

  return json({ error: "Not found" }, 404);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/logo.png" && env.ASSETS) return env.ASSETS.fetch(request);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (url.pathname.startsWith("/invoice/")) {
      if (!env.DB) return html("D1 database binding is missing.", 500);
      await ensureDb(env.DB);
      const user = await currentUser(env.DB, request);
      if (!user) return html('<!doctype html><html><head><meta charset="utf-8"><title>Login required</title></head><body><p>Login required. Open the KMS Banana Desk and verify your email OTP before printing invoices.</p></body></html>', 401);
      return invoiceHtml(env.DB, url.pathname.split("/").pop() as string, env);
    }
    return html(appShell());
  },
  async scheduled(_event: unknown, env: Env): Promise<void> {
    if (!env.DB) return;
    await ensureDb(env.DB);
    await sendDailyEmail(env.DB, env, new Date().toISOString().slice(0, 10));
  }
};

export default worker;
