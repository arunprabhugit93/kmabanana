import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("banana merchant worker: simplified invoice-centric app", async () => {
  const [page, layout, packageJson, index, shell, schema, auth, purchaseInvoices, saleInvoices, reports, whatsapp, branding, mastersImportExport, advances, dashboard, masters] = await Promise.all([
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
    readFile(new URL("../worker/invoiceBranding.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/mastersImportExport.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/advances.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/dashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/masters.ts", import.meta.url), "utf8"),
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

  // Recent fixes/additions: sub-tabs for Masters and Invoices, View Invoice
  // modal, live-updating sales invoice amount cells, the duplicate-invoice
  // notice, business branding settings, and per-master CSV import/export.
  assert.match(shell, /data-subtabs="masters"/);
  assert.match(shell, /data-subtabs="invoices"/);
  assert.match(shell, /viewInvoiceModal/);
  assert.match(shell, /data-si-amount/);
  assert.match(shell, /siExistingNotice/);
  assert.match(shell, /already exist for this vehicle/);
  assert.match(shell, /proprietor1_name/);
  assert.match(shell, /data-import-type/);
  assert.match(shell, /refreshSelectPreservingValue/);

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

  // Invoice branding: business/proprietor details editable via settings
  // (defaulting to the merchant's real bill-book details), amount in
  // words, and a signature block -- shared between purchase and sale
  // invoice HTML rather than duplicated.
  assert.match(branding, /getBusinessDetails/);
  assert.match(branding, /amountInWords/);
  assert.match(branding, /Prasanth K/);
  assert.match(purchaseInvoices, /invoiceHeaderHtml/);
  assert.match(saleInvoices, /invoiceHeaderHtml/);

  // Masters bulk import/export is scoped to the 4 master types only.
  assert.match(mastersImportExport, /banana-types/);
  assert.match(mastersImportExport, /exportMaster/);
  assert.match(mastersImportExport, /importMaster/);

  // Dashboard is now its own tab (not an always-visible header band), with
  // an all-time overall position panel netting advances against pending
  // balances.
  assert.match(shell, /\["dashboard","Dashboard"\]/);
  assert.match(shell, /id="dashboard" class="view active"/);
  assert.match(shell, /Overall position/);
  assert.match(shell, /dashboard-summary/);
  assert.match(shell, /dPayableNet/);
  assert.match(shell, /dReceivableNet/);

  // Farmer/vendor portfolio drill-down: totals, a record-advance form, an
  // advances list, and a transactions list that drills into invoice detail
  // (reusing viewInvoiceModal with a "back to portfolio" callback).
  assert.match(shell, /function viewFarmerPortfolio/);
  assert.match(shell, /function viewVendorPortfolio/);
  assert.match(shell, /farmer-portfolio\?id=/);
  assert.match(shell, /vendor-portfolio\?id=/);
  assert.match(shell, /data-portfolio-farmer/);
  assert.match(shell, /data-portfolio-vendor/);
  assert.match(shell, /Back to portfolio/);
  assert.match(shell, /Record an advance/);

  // Invoice creation asks a plain yes/no "was payment made" question
  // instead of a free-amount field; yes marks the invoice fully paid.
  assert.match(shell, /name="payment_made"/);
  assert.match(shell, /Payment made\? No/);
  assert.match(shell, /Payment made\? Yes/);
  assert.doesNotMatch(shell, /name="paid" type="number" min="0" step="0.01" placeholder="Amount paid now"/);
  assert.match(purchaseInvoices, /payment_made/);
  assert.match(saleInvoices, /payment_made/);

  // Portfolio transactions can also record a payment update in place,
  // mirroring the advance-recording flow (returns to a refreshed
  // portfolio instead of just closing the modal).
  assert.match(shell, /data-pay-tx/);
  assert.match(shell, /function updatePaidModal\(kind, invoice, onBack\)/);

  // Advances backend: farmer advances reuse the pre-existing farmer_payments
  // table, vendor advances get a new table; both feed portfolio aggregation.
  assert.match(advances, /farmerPortfolio/);
  assert.match(advances, /vendorPortfolio/);
  assert.match(advances, /createFarmerAdvance/);
  assert.match(advances, /createVendorAdvance/);
  assert.match(schema, /vendor_advances/);
  assert.match(dashboard, /outstandingPayable/);
  assert.match(dashboard, /outstandingReceivable/);

  // Farmer/vendor master lists show pending balances net of advances.
  assert.match(masters, /farmer_payments/);
  assert.match(masters, /vendor_advances/);

  // The Worker entry wires auth, routing, and login gating together.
  assert.match(index, /\/api\/auth\/request/);
  assert.match(index, /\/api\/auth\/verify/);
  assert.match(index, /Login required/);
  assert.match(index, /appShell\(\)/);
  assert.match(index, /\/api\/purchase-invoices\/create/);
  assert.match(index, /\/api\/sale-invoices\/vehicle-load/);
  assert.match(index, /\/api\/reports\/send/);
  assert.match(index, /\/api\/masters\/import/);
  assert.match(index, /\/api\/farmer-portfolio/);
  assert.match(index, /\/api\/vendor-portfolio/);
  assert.match(index, /\/api\/farmer-advances/);
  assert.match(index, /\/api\/vendor-advances/);
  assert.match(index, /\/api\/dashboard-summary/);
});
