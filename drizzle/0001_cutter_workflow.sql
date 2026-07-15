CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_no TEXT NOT NULL UNIQUE,
  driver_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cutter_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_date TEXT NOT NULL,
  farmer_id INTEGER NOT NULL,
  farmer_name TEXT NOT NULL,
  banana_type TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  submitted_by TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TEXT DEFAULT '',
  approved_by TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cutter_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  gross_weight_kg REAL NOT NULL,
  units REAL NOT NULL,
  stem_reduction_per_unit REAL NOT NULL DEFAULT 0,
  net_weight_kg REAL NOT NULL,
  grade TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_type TEXT NOT NULL,
  reference_id INTEGER,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cutter_batches_status_idx ON cutter_batches (status);
CREATE INDEX IF NOT EXISTS cutter_batches_date_idx ON cutter_batches (batch_date);
CREATE INDEX IF NOT EXISTS cutter_entries_batch_idx ON cutter_entries (batch_id);
