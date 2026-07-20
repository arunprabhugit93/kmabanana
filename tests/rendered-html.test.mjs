import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("banana merchant worker replaces the starter preview", async () => {
  const [page, layout, packageJson, index, shell, schema, invoices, auth, purchases] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/views/shell.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/invoices.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/purchases.ts", import.meta.url), "utf8"),
  ]);

  // The Next.js app router page is unreachable in production (the Worker's
  // fetch handler serves the real app for every non-API route), so it must
  // stay a harmless stub rather than the old hardcoded demo dashboard.
  assert.doesNotMatch(page, /initialPurchases|initialSales|SkeletonPreview|codex-preview|react-loading-skeleton/);
  assert.match(layout, /KMS Banana Desk/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  // The real UI lives in worker/views/shell.ts.
  assert.match(shell, /KMS Banana/);
  assert.match(shell, /id="loginForm"/);
  assert.match(shell, /id="otpForm"/);
  assert.match(shell, /class="appframe"/);
  assert.match(shell, /Workflow health/);
  assert.match(shell, /Cutter entry/);
  assert.match(shell, /Submit cutting weights/);
  assert.match(shell, /Vehicle trips/);
  assert.match(shell, /Stock reconciliation/);
  assert.match(shell, /Add staff/);
  assert.match(shell, /Activity log/);

  // Auth and schema modules.
  assert.match(auth, /kms_session/);
  assert.match(schema, /auth_otps/);
  assert.match(schema, /auth_sessions/);
  assert.match(schema, /cutter_batches/);
  assert.match(schema, /staff_users/);
  assert.match(schema, /farmer_payments/);
  assert.match(schema, /vehicle_trips/);
  assert.match(schema, /audit_logs/);

  // Invoice rendering.
  assert.match(invoices, /Print invoice/);
  assert.match(invoices, /data:image\/png;base64/);

  // Purchases still apply the cutter stem-weight reduction.
  assert.match(purchases, /stem_reduction_per_unit/);

  // The Worker entry wires auth, routing, and login gating together.
  assert.match(index, /\/api\/auth\/request/);
  assert.match(index, /\/api\/auth\/verify/);
  assert.match(index, /Login required/);
  assert.match(index, /appShell\(\)/);
});
