import { BANANAS, all } from "./util";

export async function stockReconciliation(db: D1Database, fromDate: string, toDate: string) {
  const purchased = await all(
    db,
    "SELECT banana_type, SUM(weight_kg) AS kg FROM purchases WHERE purchase_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY banana_type",
    fromDate,
    toDate
  ) as Array<{ banana_type: string; kg: number }>;
  const sold = await all(
    db,
    "SELECT banana_type, SUM(weight_kg) AS kg FROM sales WHERE sale_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY banana_type",
    fromDate,
    toDate
  ) as Array<{ banana_type: string; kg: number }>;

  const purchasedMap = Object.fromEntries(purchased.map((row) => [row.banana_type, Number(row.kg)]));
  const soldMap = Object.fromEntries(sold.map((row) => [row.banana_type, Number(row.kg)]));

  return BANANAS.map((banana) => {
    const inKg = purchasedMap[banana] || 0;
    const outKg = soldMap[banana] || 0;
    return {
      banana_type: banana,
      purchased_kg: inKg,
      sold_kg: outKg,
      balance_kg: inKg - outKg
    };
  });
}
