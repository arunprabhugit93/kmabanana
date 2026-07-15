import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("banana merchant source replaces the starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Banana trade control desk/);
  assert.match(page, /Farmer purchase entry/);
  assert.match(page, /Vendor sale entry/);
  assert.match(page, /Send WhatsApp/);
  assert.match(page, /7 day avg sell/);
  assert.match(layout, /Banana Merchant Desk/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|react-loading-skeleton/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
