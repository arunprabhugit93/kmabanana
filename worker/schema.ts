import { BANANAS, today } from "./util";

// Tables below marked "legacy" belonged to an earlier version of the app
// (daily purchase/sale entries + a separate cutter-approval workflow +
// vehicle trip costing + a farmer payment ledger). The app was simplified
// to two invoice-centric flows (purchase invoices, sales invoices) and
// those older screens were removed. The legacy tables are kept here so
// D1 keeps creating them for any environment that still has data in them
// and nothing is ever silently dropped — new code just doesn't read or
// write them anymore.
const TABLES = [
  "CREATE TABLE IF NOT EXISTS farmers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', village TEXT DEFAULT '', address TEXT DEFAULT '', gst TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', market TEXT DEFAULT '', address TEXT DEFAULT '', gst TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_no TEXT NOT NULL UNIQUE, driver_name TEXT DEFAULT '', phone TEXT DEFAULT '', notes TEXT DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS banana_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS banana_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, rate_date TEXT NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL DEFAULT '1st grade', buy_rate REAL NOT NULL, sell_rate REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(rate_date, banana_type, grade))",
  "CREATE TABLE IF NOT EXISTS purchase_invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_no TEXT NOT NULL UNIQUE, invoice_date TEXT NOT NULL, farmer_id INTEGER NOT NULL, farmer_name TEXT NOT NULL, total REAL NOT NULL DEFAULT 0, paid REAL NOT NULL DEFAULT 0, pending REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open', notes TEXT DEFAULT '', deleted_at TEXT DEFAULT '', created_by TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS purchase_invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL, units REAL NOT NULL DEFAULT 0, gross_weight_kg REAL NOT NULL DEFAULT 0, stem_reduction_per_unit REAL NOT NULL DEFAULT 0, net_weight_kg REAL NOT NULL, rate REAL NOT NULL, amount REAL NOT NULL, vehicle_no TEXT DEFAULT '', notes TEXT DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS sale_invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_no TEXT NOT NULL UNIQUE, invoice_date TEXT NOT NULL, vendor_id INTEGER NOT NULL, vendor_name TEXT NOT NULL, vehicle_no TEXT DEFAULT '', total REAL NOT NULL DEFAULT 0, paid REAL NOT NULL DEFAULT 0, pending REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open', notes TEXT DEFAULT '', deleted_at TEXT DEFAULT '', created_by TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS sale_invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL, net_weight_kg REAL NOT NULL, rate REAL NOT NULL, amount REAL NOT NULL, notes TEXT DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, log_type TEXT NOT NULL, reference_id INTEGER, status TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS email_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, report_date TEXT NOT NULL, recipients TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, provider_message TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS auth_otps (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS auth_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'staff', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, action TEXT NOT NULL, changed_by TEXT DEFAULT '', before_json TEXT DEFAULT '', after_json TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  // legacy (kept only so any existing data stays reachable)
  "CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_date TEXT NOT NULL, farmer_id INTEGER, farmer_name TEXT NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL DEFAULT '1st grade', bunches REAL NOT NULL DEFAULT 0, gross_weight_kg REAL NOT NULL DEFAULT 0, stem_reduction_per_unit REAL NOT NULL DEFAULT 0, weight_kg REAL NOT NULL, rate REAL NOT NULL, vehicle_no TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_date TEXT NOT NULL, vendor_id INTEGER, vendor_name TEXT NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL DEFAULT '1st grade', bunches REAL NOT NULL DEFAULT 0, gross_weight_kg REAL NOT NULL DEFAULT 0, stem_reduction_per_unit REAL NOT NULL DEFAULT 0, weight_kg REAL NOT NULL, rate REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, vehicle_no TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_no TEXT NOT NULL UNIQUE, party_type TEXT NOT NULL, party_id INTEGER NOT NULL, party_name TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, invoice_date TEXT NOT NULL, total REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, pending REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, item_type TEXT NOT NULL, source_id INTEGER NOT NULL, item_date TEXT NOT NULL, description TEXT NOT NULL, quantity_kg REAL NOT NULL, rate REAL NOT NULL, amount REAL NOT NULL)",
  "CREATE TABLE IF NOT EXISTS cutter_batches (id INTEGER PRIMARY KEY AUTOINCREMENT, batch_date TEXT NOT NULL, farmer_id INTEGER NOT NULL, farmer_name TEXT NOT NULL, banana_type TEXT NOT NULL, vehicle_no TEXT NOT NULL, submitted_by TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', approved_at TEXT DEFAULT '', approved_by TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS cutter_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, batch_id INTEGER NOT NULL, gross_weight_kg REAL NOT NULL, units REAL NOT NULL, stem_reduction_per_unit REAL NOT NULL DEFAULT 0, net_weight_kg REAL NOT NULL, grade TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS farmer_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, payment_date TEXT NOT NULL, farmer_id INTEGER NOT NULL, amount REAL NOT NULL, mode TEXT NOT NULL DEFAULT 'cash', notes TEXT DEFAULT '', created_by TEXT DEFAULT '', deleted_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS vehicle_trips (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_date TEXT NOT NULL, vehicle_no TEXT NOT NULL, driver_name TEXT DEFAULT '', notes TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open', deleted_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS trip_expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, expense_type TEXT NOT NULL DEFAULT 'other', amount REAL NOT NULL, notes TEXT DEFAULT '', deleted_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE INDEX IF NOT EXISTS auth_otps_email_idx ON auth_otps (email, expires_at)",
  "CREATE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions (token_hash)",
  "CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id)",
  "CREATE INDEX IF NOT EXISTS purchase_invoices_farmer_idx ON purchase_invoices (farmer_id)",
  "CREATE INDEX IF NOT EXISTS purchase_invoices_date_idx ON purchase_invoices (invoice_date)",
  "CREATE INDEX IF NOT EXISTS purchase_invoice_items_invoice_idx ON purchase_invoice_items (invoice_id)",
  "CREATE INDEX IF NOT EXISTS purchase_invoice_items_vehicle_idx ON purchase_invoice_items (vehicle_no)",
  "CREATE INDEX IF NOT EXISTS sale_invoices_vendor_idx ON sale_invoices (vendor_id)",
  "CREATE INDEX IF NOT EXISTS sale_invoices_date_idx ON sale_invoices (invoice_date)",
  "CREATE INDEX IF NOT EXISTS sale_invoices_vehicle_idx ON sale_invoices (vehicle_no)",
  "CREATE INDEX IF NOT EXISTS sale_invoice_items_invoice_idx ON sale_invoice_items (invoice_id)"
];

// Columns added after the tables above first shipped. SQLite/D1 has no
// `ADD COLUMN IF NOT EXISTS`, so existence is checked via PRAGMA first.
const ADDED_COLUMNS: Array<{ table: string; column: string; ddl: string }> = [
  { table: "farmers", column: "deleted_at", ddl: "ALTER TABLE farmers ADD COLUMN deleted_at TEXT DEFAULT ''" },
  { table: "farmers", column: "email", ddl: "ALTER TABLE farmers ADD COLUMN email TEXT DEFAULT ''" },
  { table: "vendors", column: "deleted_at", ddl: "ALTER TABLE vendors ADD COLUMN deleted_at TEXT DEFAULT ''" },
  { table: "vendors", column: "email", ddl: "ALTER TABLE vendors ADD COLUMN email TEXT DEFAULT ''" },
  { table: "vehicles", column: "deleted_at", ddl: "ALTER TABLE vehicles ADD COLUMN deleted_at TEXT DEFAULT ''" }
];

async function ensureColumns(db: D1Database) {
  for (const { table, column, ddl } of ADDED_COLUMNS) {
    const columns = await db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = (columns.results || []).some((row) => (row as { name?: string }).name === column);
    if (!exists) await db.prepare(ddl).run();
  }
}

// banana_rates originally had UNIQUE(rate_date, banana_type); grade-based
// pricing needs UNIQUE(rate_date, banana_type, grade), which SQLite can
// only achieve by rebuilding the table.
async function ensureBananaRatesGrade(db: D1Database) {
  const columns = await db.prepare("PRAGMA table_info(banana_rates)").all();
  const hasGrade = (columns.results || []).some((row) => (row as { name?: string }).name === "grade");
  if (hasGrade) return;
  await db.batch([
    db.prepare(
      "CREATE TABLE banana_rates_new (id INTEGER PRIMARY KEY AUTOINCREMENT, rate_date TEXT NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL DEFAULT '1st grade', buy_rate REAL NOT NULL, sell_rate REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(rate_date, banana_type, grade))"
    ),
    db.prepare(
      "INSERT INTO banana_rates_new (id, rate_date, banana_type, grade, buy_rate, sell_rate, created_at) SELECT id, rate_date, banana_type, '1st grade', buy_rate, sell_rate, created_at FROM banana_rates"
    ),
    db.prepare("DROP TABLE banana_rates"),
    db.prepare("ALTER TABLE banana_rates_new RENAME TO banana_rates"),
    db.prepare("CREATE INDEX IF NOT EXISTS banana_rates_lookup_idx ON banana_rates (rate_date, banana_type, grade)")
  ]);
}

export async function ensureDb(db: D1Database) {
  await db.batch(TABLES.map((sql) => db.prepare(sql)));
  await ensureColumns(db);
  await ensureBananaRatesGrade(db);
  await db.prepare("CREATE INDEX IF NOT EXISTS banana_rates_lookup_idx ON banana_rates (rate_date, banana_type, grade)").run();

  const count = await db.prepare("SELECT COUNT(*) AS count FROM farmers").first<{ count: number }>();
  if (Number(count?.count || 0) === 0) {
    await db.batch([
      db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Kumar Farms", "9876543210", "Pollachi", "North field road"),
      db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Selvi Garden", "9876501234", "Anaimalai", "Canal street"),
      db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Coimbatore Market", "9988776655", "Coimbatore", "Wholesale lane"),
      db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Town Fruit Traders", "8877665544", "Tiruppur", "Market road")
    ]);
  }

  const bananaTypeCount = await db.prepare("SELECT COUNT(*) AS count FROM banana_types").first<{ count: number }>();
  if (Number(bananaTypeCount?.count || 0) === 0) {
    await db.batch(BANANAS.map((banana) => db.prepare("INSERT INTO banana_types (name) VALUES (?)").bind(banana)));
    const day = today();
    await db.batch(BANANAS.map((banana, idx) => db.prepare("INSERT INTO banana_rates (rate_date, banana_type, grade, buy_rate, sell_rate) VALUES (?, ?, '1st grade', ?, ?)").bind(day, banana, [42, 28, 36, 58][idx], [49, 34, 43, 67][idx])));
  }

  const vehicleCount = await db.prepare("SELECT COUNT(*) AS count FROM vehicles").first<{ count: number }>();
  if (Number(vehicleCount?.count || 0) === 0) {
    await db.batch([
      db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone) VALUES (?, ?, ?)").bind("TN 38 AB 4421", "Driver 1", ""),
      db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone) VALUES (?, ?, ?)").bind("TN 39 CY 7188", "Driver 2", "")
    ]);
  }
}
