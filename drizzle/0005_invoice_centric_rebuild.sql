-- Simplifies the app around two invoice-centric flows (purchase invoices
-- from farmers, sales invoices to buyers) instead of separate daily
-- purchase/sale entries plus a later invoice-generation step. Old tables
-- (purchases, sales, cutter_batches, cutter_entries, vehicle_trips,
-- trip_expenses, farmer_payments) are left in place untouched — nothing is
-- dropped — the app simply stops reading/writing them going forward.

CREATE TABLE IF NOT EXISTS banana_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_date TEXT NOT NULL,
  farmer_id INTEGER NOT NULL,
  farmer_name TEXT NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  pending REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT DEFAULT '',
  deleted_at TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  banana_type TEXT NOT NULL,
  grade TEXT NOT NULL,
  units REAL NOT NULL DEFAULT 0,
  gross_weight_kg REAL NOT NULL DEFAULT 0,
  stem_reduction_per_unit REAL NOT NULL DEFAULT 0,
  net_weight_kg REAL NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  vehicle_no TEXT DEFAULT '',
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS sale_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_date TEXT NOT NULL,
  vendor_id INTEGER NOT NULL,
  vendor_name TEXT NOT NULL,
  vehicle_no TEXT DEFAULT '',
  total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  pending REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT DEFAULT '',
  deleted_at TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  banana_type TEXT NOT NULL,
  grade TEXT NOT NULL,
  net_weight_kg REAL NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  notes TEXT DEFAULT ''
);

ALTER TABLE farmers ADD COLUMN email TEXT DEFAULT '';
ALTER TABLE vendors ADD COLUMN email TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS purchase_invoices_farmer_idx ON purchase_invoices (farmer_id);
CREATE INDEX IF NOT EXISTS purchase_invoices_date_idx ON purchase_invoices (invoice_date);
CREATE INDEX IF NOT EXISTS purchase_invoice_items_invoice_idx ON purchase_invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS purchase_invoice_items_vehicle_idx ON purchase_invoice_items (vehicle_no);
CREATE INDEX IF NOT EXISTS sale_invoices_vendor_idx ON sale_invoices (vendor_id);
CREATE INDEX IF NOT EXISTS sale_invoices_date_idx ON sale_invoices (invoice_date);
CREATE INDEX IF NOT EXISTS sale_invoices_vehicle_idx ON sale_invoices (vehicle_no);
CREATE INDEX IF NOT EXISTS sale_invoice_items_invoice_idx ON sale_invoice_items (invoice_id);
