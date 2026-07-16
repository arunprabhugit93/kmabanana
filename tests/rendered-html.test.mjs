import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("banana merchant source replaces the starter preview", async () => {
  const [page, layout, packageJson, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /KMS Banana control desk/);
  assert.match(page, /Farmer purchase entry/);
  assert.match(page, /Vendor sale entry/);
  assert.match(page, /Send WhatsApp/);
  assert.match(page, /7 day avg sell/);
  assert.match(layout, /KMS Banana Desk/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|react-loading-skeleton/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(worker, /KMS Banana/);
  assert.match(worker, /id="loginForm"/);
  assert.match(worker, /id="otpForm"/);
  assert.match(worker, /auth_otps/);
  assert.match(worker, /auth_sessions/);
  assert.match(worker, /\/api\/auth\/request/);
  assert.match(worker, /\/api\/auth\/verify/);
  assert.match(worker, /kms_session/);
  assert.match(worker, /Login required/);
  assert.match(worker, /class="appframe"/);
  assert.match(worker, /Workflow health/);
  assert.match(worker, /Cutter entry/);
  assert.match(worker, /Submit cutting weights/);
  assert.match(worker, /cutter_batches/);
  assert.match(worker, /Print invoice/);
  assert.match(worker, /data:image\/png;base64/);
  assert.match(worker, /invoiceHtml\(env\.DB, url\.pathname\.split\("\/"\)\.pop\(\), env\)/);
  assert.match(worker, /sale_date AS item_date, banana_type, weight_kg, rate, paid, vehicle_no, notes/);
  assert.match(worker, /purchase_date AS item_date, banana_type, weight_kg, rate, bunches, vehicle_no, notes/);
  assert.match(worker, /Vehicle \$\{row\.vehicle_no\}/);
  assert.match(worker, /Units \$\{row\.bunches\}/);
  assert.doesNotMatch(worker, /class="hero"/);
});
