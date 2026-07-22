CREATE TABLE IF NOT EXISTS staff_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_date TEXT NOT NULL,
  farmer_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  mode TEXT NOT NULL DEFAULT 'cash',
  notes TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  deleted_at TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_date TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  driver_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  deleted_at TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  expense_type TEXT NOT NULL DEFAULT 'other',
  amount REAL NOT NULL,
  notes TEXT DEFAULT '',
  deleted_at TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT DEFAULT '',
  before_json TEXT DEFAULT '',
  after_json TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE purchases ADD COLUMN trip_id INTEGER;
ALTER TABLE purchases ADD COLUMN deleted_at TEXT DEFAULT '';
ALTER TABLE sales ADD COLUMN trip_id INTEGER;
ALTER TABLE sales ADD COLUMN deleted_at TEXT DEFAULT '';
ALTER TABLE farmers ADD COLUMN deleted_at TEXT DEFAULT '';
ALTER TABLE vendors ADD COLUMN deleted_at TEXT DEFAULT '';
ALTER TABLE vehicles ADD COLUMN deleted_at TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS farmer_payments_farmer_idx ON farmer_payments (farmer_id);
CREATE INDEX IF NOT EXISTS trip_expenses_trip_idx ON trip_expenses (trip_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS purchases_trip_idx ON purchases (trip_id);
CREATE INDEX IF NOT EXISTS sales_trip_idx ON sales (trip_id);
CREATE INDEX IF NOT EXISTS vehicle_trips_date_idx ON vehicle_trips (trip_date);
