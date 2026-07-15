CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  village TEXT DEFAULT '',
  address TEXT DEFAULT '',
  gst TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  market TEXT DEFAULT '',
  address TEXT DEFAULT '',
  gst TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banana_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rate_date TEXT NOT NULL,
  banana_type TEXT NOT NULL,
  buy_rate REAL NOT NULL,
  sell_rate REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rate_date, banana_type)
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_date TEXT NOT NULL,
  farmer_id INTEGER,
  farmer_name TEXT NOT NULL,
  banana_type TEXT NOT NULL,
  bunches REAL NOT NULL DEFAULT 0,
  weight_kg REAL NOT NULL,
  rate REAL NOT NULL,
  vehicle_no TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_date TEXT NOT NULL,
  vendor_id INTEGER,
  vendor_name TEXT NOT NULL,
  banana_type TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  rate REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  vehicle_no TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,
  party_type TEXT NOT NULL,
  party_id INTEGER NOT NULL,
  party_name TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  total REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  pending REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  item_date TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity_kg REAL NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date TEXT NOT NULL,
  recipients TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases (purchase_date);
CREATE INDEX IF NOT EXISTS sales_date_idx ON sales (sale_date);
CREATE INDEX IF NOT EXISTS purchases_farmer_idx ON purchases (farmer_id);
CREATE INDEX IF NOT EXISTS sales_vendor_idx ON sales (vendor_id);
CREATE INDEX IF NOT EXISTS invoices_party_idx ON invoices (party_type, party_id);
