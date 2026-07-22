-- Adds grade (1st/2nd/3rd) as a pricing dimension, and lets owner-entered
-- purchases/sales record gross weight + stem reduction like the cutter
-- workflow already does. banana_rates needs its UNIQUE constraint changed
-- (date, banana_type) -> (date, banana_type, grade), which SQLite can only
-- do by rebuilding the table; the runtime bootstrap in worker/schema.ts
-- performs the equivalent migration idempotently against the live database.

ALTER TABLE purchases ADD COLUMN grade TEXT NOT NULL DEFAULT '1st grade';
ALTER TABLE purchases ADD COLUMN gross_weight_kg REAL NOT NULL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN stem_reduction_per_unit REAL NOT NULL DEFAULT 0;

ALTER TABLE sales ADD COLUMN grade TEXT NOT NULL DEFAULT '1st grade';
ALTER TABLE sales ADD COLUMN gross_weight_kg REAL NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN stem_reduction_per_unit REAL NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN bunches REAL NOT NULL DEFAULT 0;

CREATE TABLE banana_rates_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rate_date TEXT NOT NULL,
  banana_type TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '1st grade',
  buy_rate REAL NOT NULL,
  sell_rate REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rate_date, banana_type, grade)
);
INSERT INTO banana_rates_new (id, rate_date, banana_type, grade, buy_rate, sell_rate, created_at)
  SELECT id, rate_date, banana_type, '1st grade', buy_rate, sell_rate, created_at FROM banana_rates;
DROP TABLE banana_rates;
ALTER TABLE banana_rates_new RENAME TO banana_rates;
CREATE INDEX IF NOT EXISTS banana_rates_lookup_idx ON banana_rates (rate_date, banana_type, grade);
