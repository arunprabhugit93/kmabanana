-- Advance payments: money given to a farmer or received from a vendor
-- outside of (and in addition to) the per-invoice paid/pending tracking on
-- purchase_invoices/sale_invoices. Nets off against the farmer/vendor's
-- outstanding balance in their portfolio view and the masters list.
--
-- The farmer side reuses the existing farmer_payments table (it already
-- had exactly this shape from an earlier version of the app and was just
-- sitting unused) rather than creating a duplicate. Vendors never had an
-- equivalent table, so vendor_advances is new.

CREATE TABLE IF NOT EXISTS vendor_advances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  advance_date TEXT NOT NULL,
  amount REAL NOT NULL,
  mode TEXT NOT NULL DEFAULT 'cash',
  notes TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  deleted_at TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS vendor_advances_vendor_idx ON vendor_advances (vendor_id);
