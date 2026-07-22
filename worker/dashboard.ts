export async function dashboardSummary(db: D1Database) {
  const [invoiceTotals, advanceTotals] = await Promise.all([
    db.prepare(
      `SELECT
         (SELECT COALESCE(SUM(total), 0) FROM purchase_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL)) AS purchaseTotal,
         (SELECT COALESCE(SUM(paid), 0) FROM purchase_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL)) AS purchasePaid,
         (SELECT COALESCE(SUM(pending), 0) FROM purchase_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL)) AS purchasePending,
         (SELECT COALESCE(SUM(total), 0) FROM sale_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL)) AS saleTotal,
         (SELECT COALESCE(SUM(paid), 0) FROM sale_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL)) AS salePaid,
         (SELECT COALESCE(SUM(pending), 0) FROM sale_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL)) AS salePending`
    ).first<{
      purchaseTotal: number;
      purchasePaid: number;
      purchasePending: number;
      saleTotal: number;
      salePaid: number;
      salePending: number;
    }>(),
    db.prepare(
      `SELECT
         (SELECT COALESCE(SUM(amount), 0) FROM farmer_payments WHERE deleted_at = '' OR deleted_at IS NULL) AS farmerAdvances,
         (SELECT COALESCE(SUM(amount), 0) FROM vendor_advances WHERE deleted_at = '' OR deleted_at IS NULL) AS vendorAdvances`
    ).first<{ farmerAdvances: number; vendorAdvances: number }>()
  ]);

  const purchasePending = Number(invoiceTotals?.purchasePending || 0);
  const salePending = Number(invoiceTotals?.salePending || 0);
  const farmerAdvances = Number(advanceTotals?.farmerAdvances || 0);
  const vendorAdvances = Number(advanceTotals?.vendorAdvances || 0);

  return {
    purchaseTotal: Number(invoiceTotals?.purchaseTotal || 0),
    purchasePaid: Number(invoiceTotals?.purchasePaid || 0),
    purchasePending,
    saleTotal: Number(invoiceTotals?.saleTotal || 0),
    salePaid: Number(invoiceTotals?.salePaid || 0),
    salePending,
    farmerAdvances,
    vendorAdvances,
    outstandingPayable: purchasePending - farmerAdvances,
    outstandingReceivable: salePending - vendorAdvances
  };
}
