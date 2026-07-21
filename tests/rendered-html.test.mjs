import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("banana merchant worker: simplified invoice-centric app", async () => {
  const [page, layout, packageJson, index, shell, schema, auth, purchaseInvoices, saleInvoices, reports, whatsapp] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/views/shell.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/purchaseInvoices.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/saleInvoices.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/reports.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/whatsapp.ts", import.meta.url), "utf8"),
  ]);

  // The Next.js app router page is unreachable in production (the Worker's
  // fetch handler serves the real app for every non-API route), so it must
  // stay a harmless stub rather than the old hardcoded demo dashboard.
  assert.doesNotMatch(page, /initialPurchases|initialSales|SkeletonPreview|codex-preview|react-loading-skeleton/);
  assert.match(layout, /KMS Banana Desk/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  // Only owner/staff roles remain; the cutter workflow, vehicle trips,
  // farmer ledger, and stock reconciliation screens were removed per the
  // simplification request.
  assert.doesNotMatch(auth, /"cutter"/);
  assert.doesNotMatch(shell, /Cutter entry|viewCutterBatch|Vehicle trip costing|Stock reconciliation|Record payment|Import \/ Export/);

  // The real UI lives in worker/views/shell.ts, now invoice-centric.
  assert.match(shell, /KMS Banana/);
  assert.match(shell, /id="loginForm"/);
  assert.match(shell, /id="otpForm"/);
  assert.match(shell, /class="appframe"/);
  assert.match(shell, /Purchase Invoice/);
  assert.match(shell, /Sales Invoice/);
  assert.match(shell, /Load vehicle's purchases/);
  assert.match(shell, /Verify &amp; save invoice/);
  assert.match(shell, /Gross weight kg/);
  assert.match(shell, /Rate board by grade/);
  assert.match(shell, /Banana types/);
  assert.match(shell, /Add staff/);
  assert.match(shell, /Activity log/);
  assert.match(shell, /whatsapp_numbers/);

  // Schema: new invoice-centric tables and grade-aware rates; legacy
  // tables are kept (not dropped) so old data stays reachable.
  assert.match(schema, /auth_otps/);
  assert.match(schema, /auth_sessions/);
  assert.match(schema, /staff_users/);
  assert.match(schema, /audit_logs/);
  assert.match(schema, /banana_types/);
  assert.match(schema, /purchase_invoices/);
  assert.match(schema, /purchase_invoice_items/);
  assert.match(schema, /sale_invoices/);
  assert.match(schema, /sale_invoice_items/);
  assert.match(schema, /UNIQUE\(rate_date, banana_type, grade\)/);
  assert.match(schema, /ALTER TABLE farmers ADD COLUMN email/);

  // Purchase invoices: multi-line, stem-weight reduction, grade, per-line
  // vehicle, printable, and sent automatically on save.
  assert.match(purchaseInvoices, /stem_reduction_per_unit/);
  assert.match(purchaseInvoices, /Print invoice/);
  assert.match(purchaseInvoices, /sendPurchaseInvoice/);

  // Sales invoices: auto-populate from a vehicle's purchased load for a date.
  assert.match(saleInvoices, /vehicleLoadAvailable/);
  assert.match(saleInvoices, /available_kg/);
  assert.match(saleInvoices, /sendSaleInvoice/);

  // Reports: day/week/month margin by banana type + grade, scheduled send.
  assert.match(reports, /periodReport/);
  assert.match(reports, /runScheduledReports/);
  assert.match(reports, /Weekly/);
  assert.match(reports, /Monthly/);

  // WhatsApp: gracefully no-ops until real credentials are configured,
  // same pattern as email.
  assert.match(whatsapp, /WHATSAPP_ACCESS_TOKEN/);
  assert.match(whatsapp, /is not configured/);

  // The Worker entry wires auth, routing, and login gating together.
  assert.match(index, /\/api\/auth\/request/);
  assert.match(index, /\/api\/auth\/verify/);
  assert.match(index, /Login required/);
  assert.match(index, /appShell\(\)/);
  assert.match(index, /\/api\/purchase-invoices\/create/);
  assert.match(index, /\/api\/sale-invoices\/vehicle-load/);
  assert.match(index, /\/api\/reports\/send/);
});
