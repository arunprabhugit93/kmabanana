"use client";

import { FormEvent, useMemo, useState } from "react";

type BananaType = "Nendran" | "Robusta" | "Poovan" | "Red Banana";

type Rate = {
  date: string;
  banana: BananaType;
  buyRate: number;
  sellRate: number;
};

type Purchase = {
  id: number;
  date: string;
  farmer: string;
  banana: BananaType;
  bunches: number;
  weightKg: number;
  rate: number;
  vehicle: string;
};

type Sale = {
  id: number;
  date: string;
  vendor: string;
  banana: BananaType;
  weightKg: number;
  rate: number;
  vehicle: string;
  paid: number;
};

const bananaTypes: BananaType[] = ["Nendran", "Robusta", "Poovan", "Red Banana"];

const initialRates: Rate[] = [
  { date: "2026-07-15", banana: "Nendran", buyRate: 42, sellRate: 49 },
  { date: "2026-07-15", banana: "Robusta", buyRate: 28, sellRate: 34 },
  { date: "2026-07-15", banana: "Poovan", buyRate: 36, sellRate: 43 },
  { date: "2026-07-15", banana: "Red Banana", buyRate: 58, sellRate: 67 },
  { date: "2026-07-14", banana: "Nendran", buyRate: 40, sellRate: 47 },
  { date: "2026-07-13", banana: "Nendran", buyRate: 41, sellRate: 48 },
  { date: "2026-07-12", banana: "Nendran", buyRate: 39, sellRate: 46 },
];

const initialPurchases: Purchase[] = [
  {
    id: 1,
    date: "2026-07-15",
    farmer: "Kumar Farms",
    banana: "Nendran",
    bunches: 260,
    weightKg: 1820,
    rate: 42,
    vehicle: "TN 38 AB 4421",
  },
  {
    id: 2,
    date: "2026-07-15",
    farmer: "Selvi Garden",
    banana: "Robusta",
    bunches: 180,
    weightKg: 1260,
    rate: 28,
    vehicle: "TN 38 AB 4421",
  },
  {
    id: 3,
    date: "2026-07-15",
    farmer: "Muthu Estate",
    banana: "Poovan",
    bunches: 150,
    weightKg: 940,
    rate: 36,
    vehicle: "TN 39 CY 7188",
  },
  {
    id: 4,
    date: "2026-07-14",
    farmer: "Kumar Farms",
    banana: "Nendran",
    bunches: 210,
    weightKg: 1470,
    rate: 40,
    vehicle: "TN 38 AB 4421",
  },
];

const initialSales: Sale[] = [
  {
    id: 1,
    date: "2026-07-15",
    vendor: "Coimbatore Market",
    banana: "Nendran",
    weightKg: 1150,
    rate: 49,
    vehicle: "TN 38 AB 4421",
    paid: 50000,
  },
  {
    id: 2,
    date: "2026-07-15",
    vendor: "Town Fruit Traders",
    banana: "Robusta",
    weightKg: 900,
    rate: 34,
    vehicle: "TN 38 AB 4421",
    paid: 26000,
  },
  {
    id: 3,
    date: "2026-07-15",
    vendor: "Pollachi Wholesale",
    banana: "Poovan",
    weightKg: 780,
    rate: 43,
    vehicle: "TN 39 CY 7188",
    paid: 25000,
  },
  {
    id: 4,
    date: "2026-07-14",
    vendor: "Coimbatore Market",
    banana: "Nendran",
    weightKg: 1100,
    rate: 47,
    vehicle: "TN 38 AB 4421",
    paid: 51700,
  },
];

const money = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "INR",
});

const number = new Intl.NumberFormat("en-IN");

function formatMoney(value: number) {
  return money.format(value).replace("₹", "Rs ");
}

function totalPurchase(purchase: Purchase) {
  return purchase.weightKg * purchase.rate;
}

function totalSale(sale: Sale) {
  return sale.weightKg * sale.rate;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export default function Home() {
  const [rates, setRates] = useState<Rate[]>(initialRates);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [date, setDate] = useState("2026-07-15");
  const [reportType, setReportType] = useState("day");
  const [reportTarget, setReportTarget] = useState("All");
  const [copied, setCopied] = useState(false);

  const todaysRates = useMemo(() => rates.filter((rate) => rate.date === date), [rates, date]);
  const todaysPurchases = useMemo(
    () => purchases.filter((purchase) => purchase.date === date),
    [purchases, date],
  );
  const todaysSales = useMemo(() => sales.filter((sale) => sale.date === date), [sales, date]);

  const vehicles = unique([...purchases, ...sales].map((record) => record.vehicle));
  const farmers = unique(purchases.map((purchase) => purchase.farmer));
  const vendors = unique(sales.map((sale) => sale.vendor));

  const dailyPurchaseValue = todaysPurchases.reduce((sum, item) => sum + totalPurchase(item), 0);
  const dailySalesValue = todaysSales.reduce((sum, item) => sum + totalSale(item), 0);
  const collected = todaysSales.reduce((sum, item) => sum + item.paid, 0);
  const totalWeight = todaysPurchases.reduce((sum, item) => sum + item.weightKg, 0);
  const margin = dailySalesValue - dailyPurchaseValue;

  const weekStart = new Date(`${date}T00:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekRates = rates.filter((rate) => {
    const rateDate = new Date(`${rate.date}T00:00:00`);
    return rateDate >= weekStart && rateDate <= new Date(`${date}T00:00:00`);
  });

  const reportRows = useMemo(() => {
    if (reportType === "vehicle" && reportTarget !== "All") {
      return {
        purchases: todaysPurchases.filter((item) => item.vehicle === reportTarget),
        sales: todaysSales.filter((item) => item.vehicle === reportTarget),
      };
    }

    if (reportType === "farmer" && reportTarget !== "All") {
      return {
        purchases: purchases.filter((item) => item.farmer === reportTarget),
        sales: [] as Sale[],
      };
    }

    if (reportType === "vendor" && reportTarget !== "All") {
      return {
        purchases: [] as Purchase[],
        sales: sales.filter((item) => item.vendor === reportTarget),
      };
    }

    return { purchases: todaysPurchases, sales: todaysSales };
  }, [reportType, reportTarget, purchases, sales, todaysPurchases, todaysSales]);

  const reportText = useMemo(() => {
    const purchaseValue = reportRows.purchases.reduce((sum, item) => sum + totalPurchase(item), 0);
    const saleValue = reportRows.sales.reduce((sum, item) => sum + totalSale(item), 0);
    const pending = reportRows.sales.reduce((sum, item) => sum + totalSale(item) - item.paid, 0);
    const lines = [
      `Banana Merchant Report - ${date}`,
      `Report: ${reportType.toUpperCase()} ${reportTarget !== "All" ? `- ${reportTarget}` : ""}`,
      `Purchase value: ${formatMoney(purchaseValue)}`,
      `Sales value: ${formatMoney(saleValue)}`,
      `Pending collection: ${formatMoney(pending)}`,
      "",
      "Purchases:",
      ...reportRows.purchases.map(
        (item) =>
          `${item.farmer} | ${item.banana} | ${number.format(item.weightKg)} kg | ${formatMoney(
            totalPurchase(item),
          )} | ${item.vehicle}`,
      ),
      "",
      "Sales:",
      ...reportRows.sales.map(
        (item) =>
          `${item.vendor} | ${item.banana} | ${number.format(item.weightKg)} kg | ${formatMoney(
            totalSale(item),
          )} | paid ${formatMoney(item.paid)} | ${item.vehicle}`,
      ),
    ];

    return lines.join("\n");
  }, [date, reportRows, reportTarget, reportType]);

  function addRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const banana = form.get("banana") as BananaType;
    const buyRate = Number(form.get("buyRate"));
    const sellRate = Number(form.get("sellRate"));

    setRates((current) => [
      { date, banana, buyRate, sellRate },
      ...current.filter((rate) => !(rate.date === date && rate.banana === banana)),
    ]);
    event.currentTarget.reset();
  }

  function addPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const banana = form.get("banana") as BananaType;
    const rate = Number(form.get("rate"));
    const purchase: Purchase = {
      id: Date.now(),
      date,
      farmer: String(form.get("farmer") || "Unknown farmer"),
      banana,
      bunches: Number(form.get("bunches")),
      weightKg: Number(form.get("weightKg")),
      rate,
      vehicle: String(form.get("vehicle") || "No vehicle"),
    };

    setPurchases((current) => [purchase, ...current]);
    event.currentTarget.reset();
  }

  function addSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sale: Sale = {
      id: Date.now(),
      date,
      vendor: String(form.get("vendor") || "Unknown vendor"),
      banana: form.get("banana") as BananaType,
      weightKg: Number(form.get("weightKg")),
      rate: Number(form.get("rate")),
      vehicle: String(form.get("vehicle") || "No vehicle"),
      paid: Number(form.get("paid")),
    };

    setSales((current) => [sale, ...current]);
    event.currentTarget.reset();
  }

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const emailHref = `mailto:?subject=${encodeURIComponent(
    `Banana report ${date}`,
  )}&body=${encodeURIComponent(reportText)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(reportText)}`;

  const targetOptions =
    reportType === "vehicle"
      ? vehicles
      : reportType === "farmer"
        ? farmers
        : reportType === "vendor"
          ? vendors
          : [];

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Banana trade control desk</p>
          <h1>Daily billing, loading, and settlement reports</h1>
          <p className="hero-copy">
            Track banana rates, farmer purchases, vehicle loads, vendor sales,
            collections, and share-ready daily reports from one screen.
          </p>
        </div>
        <div className="date-panel">
          <label htmlFor="business-date">Business date</label>
          <input
            id="business-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <span>{number.format(totalWeight)} kg received today</span>
        </div>
      </section>

      <section className="metric-grid" aria-label="Daily summary">
        <Metric label="Purchase value" value={formatMoney(dailyPurchaseValue)} />
        <Metric label="Sales value" value={formatMoney(dailySalesValue)} />
        <Metric label="Gross margin" value={formatMoney(margin)} tone={margin >= 0 ? "good" : "bad"} />
        <Metric label="Pending collection" value={formatMoney(dailySalesValue - collected)} />
      </section>

      <section className="workspace-grid">
        <div className="panel wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Rates</p>
              <h2>Today&apos;s banana rates</h2>
            </div>
          </div>
          <div className="rate-strip">
            {bananaTypes.map((banana) => {
              const rate = todaysRates.find((item) => item.banana === banana);
              const week = weekRates.filter((item) => item.banana === banana);
              return (
                <article className="rate-card" key={banana}>
                  <div>
                    <h3>{banana}</h3>
                    <span>7 day avg sell: {formatMoney(average(week.map((item) => item.sellRate)))}</span>
                  </div>
                  <strong>{rate ? formatMoney(rate.sellRate) : "No rate"}</strong>
                  <small>Buy {rate ? formatMoney(rate.buyRate) : "-"}</small>
                </article>
              );
            })}
          </div>
          <form className="inline-form" onSubmit={addRate}>
            <select name="banana" aria-label="Banana type">
              {bananaTypes.map((banana) => (
                <option key={banana}>{banana}</option>
              ))}
            </select>
            <input name="buyRate" type="number" min="1" placeholder="Buy rate" required />
            <input name="sellRate" type="number" min="1" placeholder="Sell rate" required />
            <button type="submit">Update rate</button>
          </form>
        </div>

        <EntryPanel title="Farmer purchase entry" eyebrow="Inbound load" onSubmit={addPurchase}>
          <input name="farmer" placeholder="Farmer name" required />
          <select name="banana" aria-label="Banana type">
            {bananaTypes.map((banana) => (
              <option key={banana}>{banana}</option>
            ))}
          </select>
          <input name="bunches" type="number" min="1" placeholder="Bunches" required />
          <input name="weightKg" type="number" min="1" placeholder="Weight kg" required />
          <input name="rate" type="number" min="1" placeholder="Rate per kg" required />
          <input name="vehicle" placeholder="Vehicle number" required />
        </EntryPanel>

        <EntryPanel title="Vendor sale entry" eyebrow="Outbound bill" onSubmit={addSale}>
          <input name="vendor" placeholder="Vendor name" required />
          <select name="banana" aria-label="Banana type">
            {bananaTypes.map((banana) => (
              <option key={banana}>{banana}</option>
            ))}
          </select>
          <input name="weightKg" type="number" min="1" placeholder="Weight kg" required />
          <input name="rate" type="number" min="1" placeholder="Sale rate per kg" required />
          <input name="paid" type="number" min="0" placeholder="Amount paid" required />
          <input name="vehicle" placeholder="Vehicle number" required />
        </EntryPanel>
      </section>

      <section className="report-band">
        <div className="report-controls">
          <div>
            <p className="eyebrow">Reports</p>
            <h2>Separate reports by day, vehicle, farmer, or vendor</h2>
          </div>
          <div className="segmented" aria-label="Report type">
            {["day", "vehicle", "farmer", "vendor"].map((type) => (
              <button
                className={reportType === type ? "active" : ""}
                key={type}
                onClick={() => {
                  setReportType(type);
                  setReportTarget("All");
                }}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
          {targetOptions.length > 0 ? (
            <select value={reportTarget} onChange={(event) => setReportTarget(event.target.value)}>
              <option>All</option>
              {targetOptions.map((target) => (
                <option key={target}>{target}</option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="report-grid">
          <div className="table-panel">
            <h3>Purchases</h3>
            <DataTable
              empty="No purchases for this report"
              rows={reportRows.purchases.map((item) => [
                item.farmer,
                item.banana,
                `${number.format(item.weightKg)} kg`,
                formatMoney(totalPurchase(item)),
                item.vehicle,
              ])}
            />
          </div>
          <div className="table-panel">
            <h3>Sales</h3>
            <DataTable
              empty="No sales for this report"
              rows={reportRows.sales.map((item) => [
                item.vendor,
                item.banana,
                `${number.format(item.weightKg)} kg`,
                formatMoney(totalSale(item) - item.paid),
                item.vehicle,
              ])}
            />
          </div>
        </div>

        <div className="share-panel">
          <textarea readOnly value={reportText} aria-label="Generated report text" />
          <div className="action-row">
            <button type="button" onClick={copyReport}>
              {copied ? "Copied" : "Copy report"}
            </button>
            <a href={emailHref}>Send email</a>
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Send WhatsApp
            </a>
            <button type="button" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <article className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EntryPanel({
  children,
  eyebrow,
  onSubmit,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
}) {
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <form className="entry-form" onSubmit={onSubmit}>
        {children}
        <button type="submit">Save entry</button>
      </form>
    </div>
  );
}

function DataTable({ empty, rows }: { empty: string; rows: string[][] }) {
  if (!rows.length) {
    return <p className="empty-state">{empty}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
