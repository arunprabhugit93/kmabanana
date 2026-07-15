const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];

const TABLES = [
  "CREATE TABLE IF NOT EXISTS farmers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', village TEXT DEFAULT '', address TEXT DEFAULT '', gst TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', market TEXT DEFAULT '', address TEXT DEFAULT '', gst TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS banana_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, rate_date TEXT NOT NULL, banana_type TEXT NOT NULL, buy_rate REAL NOT NULL, sell_rate REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(rate_date, banana_type))",
  "CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_date TEXT NOT NULL, farmer_id INTEGER, farmer_name TEXT NOT NULL, banana_type TEXT NOT NULL, bunches REAL NOT NULL DEFAULT 0, weight_kg REAL NOT NULL, rate REAL NOT NULL, vehicle_no TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_date TEXT NOT NULL, vendor_id INTEGER, vendor_name TEXT NOT NULL, banana_type TEXT NOT NULL, weight_kg REAL NOT NULL, rate REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, vehicle_no TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_no TEXT NOT NULL UNIQUE, party_type TEXT NOT NULL, party_id INTEGER NOT NULL, party_name TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, invoice_date TEXT NOT NULL, total REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, pending REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, item_type TEXT NOT NULL, source_id INTEGER NOT NULL, item_date TEXT NOT NULL, description TEXT NOT NULL, quantity_kg REAL NOT NULL, rate REAL NOT NULL, amount REAL NOT NULL)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS email_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, report_date TEXT NOT NULL, recipients TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, provider_message TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases (purchase_date)",
  "CREATE INDEX IF NOT EXISTS sales_date_idx ON sales (sale_date)",
  "CREATE INDEX IF NOT EXISTS purchases_farmer_idx ON purchases (farmer_id)",
  "CREATE INDEX IF NOT EXISTS sales_vendor_idx ON sales (vendor_id)",
  "CREATE INDEX IF NOT EXISTS invoices_party_idx ON invoices (party_type, party_id)"
];

const APP_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Banana Merchant Desk</title>
  <style>
    :root{--bg:#f7f6f1;--ink:#1f2a24;--muted:#647069;--panel:#fff;--soft:#edf4e7;--line:#d8dfcf;--brand:#3f7c4c;--dark:#255a35;--accent:#d6a231;--bad:#a84436}
    *{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,rgba(63,124,76,.1),transparent 300px),var(--bg);color:var(--ink);font-family:Arial,Helvetica,sans-serif}button,input,select,textarea{font:inherit}button,.btn{align-items:center;background:var(--brand);border:0;border-radius:6px;color:#fff;cursor:pointer;display:inline-flex;font-weight:700;justify-content:center;min-height:40px;padding:9px 13px;text-decoration:none}button:hover,.btn:hover{background:var(--dark)}button.secondary,.btn.secondary{background:#e8eddf;color:var(--ink)}button.secondary:hover,.btn.secondary:hover{background:#dce5d3}input,select,textarea{background:#fff;border:1px solid var(--line);border-radius:6px;color:var(--ink);padding:10px 11px;width:100%}textarea{min-height:160px;resize:vertical}h1,h2,h3,p{margin:0}.shell{margin:0 auto;max-width:1500px;padding:22px}.hero{align-items:end;background:linear-gradient(115deg,rgba(31,42,36,.96),rgba(37,90,53,.92));color:#fff;display:grid;gap:24px;grid-template-columns:minmax(0,1fr) 340px;padding:38px}.hero h1{font-size:clamp(2rem,4vw,4.3rem);line-height:1}.copy{color:rgba(255,255,255,.82);font-size:1.05rem;line-height:1.55;margin-top:16px;max-width:760px}.eyebrow{color:var(--accent);font-size:.74rem;font-weight:800;text-transform:uppercase}.datebox{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:8px;display:grid;gap:10px;padding:17px}.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.tabs button{background:#e8eddf;color:var(--ink)}.tabs button.active{background:var(--brand);color:#fff}.metrics{display:grid;gap:12px;grid-template-columns:repeat(5,minmax(0,1fr));margin:16px 0}.metric{background:var(--panel);border:1px solid var(--line);border-left:5px solid var(--brand);border-radius:8px;display:grid;gap:7px;min-height:100px;padding:15px}.metric span{color:var(--muted);font-size:.78rem;font-weight:800;text-transform:uppercase}.metric strong{font-size:clamp(1.2rem,2vw,1.8rem)}.view{display:none}.view.active{display:block}.grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:18px}.wide{grid-column:1/-1}.heading{align-items:end;display:flex;gap:12px;justify-content:space-between;margin-bottom:14px}.heading h2{font-size:1.25rem;margin-top:3px}.formgrid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.formgrid button{align-self:end}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.actions{display:flex;flex-wrap:wrap;gap:9px}.tablewrap{overflow:auto}table{border-collapse:collapse;width:100%}th,td{border-top:1px solid var(--line);font-size:.88rem;padding:9px 8px;text-align:left;white-space:nowrap}th{background:#f3f6ee;color:var(--muted);font-size:.74rem;text-transform:uppercase}td:first-child{font-weight:700}.rates{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr))}.rate{background:var(--soft);border:1px solid var(--line);border-radius:8px;display:grid;gap:8px;min-height:118px;padding:14px}.rate strong{font-size:1.4rem}.notice{background:#fff7df;border:1px solid #ead394;border-radius:8px;color:#654d10;padding:12px}.printHint{color:var(--muted);font-size:.85rem}.status{color:var(--muted);font-size:.9rem;min-height:22px}.danger{color:var(--bad)}@media(max-width:1050px){.hero,.grid{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rates,.formgrid,.four{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.shell{padding:12px}.hero{padding:24px 18px}.metrics,.rates,.formgrid,.two,.four{grid-template-columns:1fr}.heading{align-items:start;flex-direction:column}}
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Banana merchant operations</p>
        <h1>Purchases, sales, invoices, imports, and daily reports</h1>
        <p class="copy">A database-backed desk for daily banana rates, farmer bills, vendor invoices, vehicle-wise loading, monthly Excel-compatible exports, and email-ready reports.</p>
      </div>
      <div class="datebox">
        <label for="bizDate">Business date</label>
        <input id="bizDate" type="date">
        <label for="month">Report month</label>
        <input id="month" type="month">
        <button id="refresh">Refresh data</button>
      </div>
    </section>

    <nav class="tabs" id="tabs"></nav>

    <section class="metrics">
      <article class="metric"><span>Purchase value</span><strong id="mPurchase">Rs 0</strong></article>
      <article class="metric"><span>Sales value</span><strong id="mSales">Rs 0</strong></article>
      <article class="metric"><span>Margin</span><strong id="mMargin">Rs 0</strong></article>
      <article class="metric"><span>Pending collection</span><strong id="mPending">Rs 0</strong></article>
      <article class="metric"><span>Stock balance</span><strong id="mStock">0 kg</strong></article>
    </section>

    <section id="dashboard" class="view active">
      <div class="grid">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Daily rates</p><h2>Banana rates and 7-day averages</h2></div></div>
          <div class="rates" id="rateCards"></div>
          <form class="formgrid four" id="rateForm">
            <select name="banana_type"></select>
            <input name="buy_rate" type="number" min="0" step="0.01" placeholder="Buy rate / kg" required>
            <input name="sell_rate" type="number" min="0" step="0.01" placeholder="Sell rate / kg" required>
            <button>Save rate</button>
          </form>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Recent purchases</p><h2>Farmer loads</h2></div></div><div id="recentPurchases"></div></div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Recent sales</p><h2>Vendor dispatches</h2></div></div><div id="recentSales"></div></div>
      </div>
    </section>

    <section id="masters" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Farmers</h2></div><a class="btn secondary" href="/api/template?type=farmers">Template</a></div>
          <form class="formgrid two" id="farmerForm">
            <input name="name" placeholder="Farmer name" required><input name="phone" placeholder="Phone">
            <input name="village" placeholder="Village"><input name="gst" placeholder="GST / tax id">
            <textarea name="address" placeholder="Address"></textarea><textarea name="notes" placeholder="Notes"></textarea>
            <button>Save farmer</button>
          </form>
          <div id="farmersTable"></div>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Vendors</h2></div><a class="btn secondary" href="/api/template?type=vendors">Template</a></div>
          <form class="formgrid two" id="vendorForm">
            <input name="name" placeholder="Vendor name" required><input name="phone" placeholder="Phone">
            <input name="market" placeholder="Market"><input name="gst" placeholder="GST / tax id">
            <textarea name="address" placeholder="Address"></textarea><textarea name="notes" placeholder="Notes"></textarea>
            <button>Save vendor</button>
          </form>
          <div id="vendorsTable"></div>
        </div>
      </div>
    </section>

    <section id="transactions" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Inbound</p><h2>Purchase from farmer</h2></div></div>
          <form class="formgrid two" id="purchaseForm">
            <select name="farmer_id" required></select><select name="banana_type"></select>
            <input name="bunches" type="number" min="0" step="0.01" placeholder="Bunches"><input name="weight_kg" type="number" min="0" step="0.01" placeholder="Weight kg" required>
            <input name="rate" type="number" min="0" step="0.01" placeholder="Rate / kg" required><input name="vehicle_no" placeholder="Vehicle number" required>
            <textarea name="notes" placeholder="Notes"></textarea><button>Save purchase</button>
          </form>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Outbound</p><h2>Sale to vendor</h2></div></div>
          <form class="formgrid two" id="saleForm">
            <select name="vendor_id" required></select><select name="banana_type"></select>
            <input name="weight_kg" type="number" min="0" step="0.01" placeholder="Weight kg" required><input name="rate" type="number" min="0" step="0.01" placeholder="Sale rate / kg" required>
            <input name="paid" type="number" min="0" step="0.01" placeholder="Amount paid"><input name="vehicle_no" placeholder="Vehicle number" required>
            <textarea name="notes" placeholder="Notes"></textarea><button>Save sale</button>
          </form>
        </div>
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Daily list</p><h2>Purchase and sales records</h2></div></div><div id="transactionTables"></div></div>
      </div>
    </section>

    <section id="invoices" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Billing</p><h2>Create invoice</h2></div></div>
          <form class="formgrid two" id="invoiceForm">
            <select name="party_type"><option value="farmer">Farmer payable invoice</option><option value="vendor">Vendor sales invoice</option></select>
            <select name="party_id"></select>
            <input name="from_date" type="date" required><input name="to_date" type="date" required>
            <button>Generate invoice</button>
          </form>
          <p class="printHint">Each invoice opens as a print-ready page.</p>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Invoices</p><h2>Recent invoices</h2></div></div><div id="invoiceTable"></div></div>
      </div>
    </section>

    <section id="imports" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Bulk upload</p><h2>Upload Excel-compatible CSV</h2></div></div>
          <div class="notice">Download a template, fill it in Excel, save as CSV, then upload it here. Supported: farmers, vendors, purchases, sales.</div>
          <form class="formgrid two" id="importForm">
            <select name="type"><option>farmers</option><option>vendors</option><option>purchases</option><option>sales</option></select>
            <input name="file" type="file" accept=".csv,text/csv" required>
            <button>Upload CSV</button>
          </form>
          <div class="actions">
            <a class="btn secondary" href="/api/template?type=farmers">Farmers template</a>
            <a class="btn secondary" href="/api/template?type=vendors">Vendors template</a>
            <a class="btn secondary" href="/api/template?type=purchases">Purchases template</a>
            <a class="btn secondary" href="/api/template?type=sales">Sales template</a>
          </div>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Downloads</p><h2>Monthly purchase and sales Excel files</h2></div></div>
          <div class="actions">
            <button class="secondary" data-export="farmers">Farmers list</button>
            <button class="secondary" data-export="vendors">Vendors list</button>
            <button class="secondary" data-export="purchases">Previous month purchases</button>
            <button class="secondary" data-export="sales">Previous month sales</button>
          </div>
          <p class="status" id="importStatus"></p>
        </div>
      </div>
    </section>

    <section id="reports" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Daily report</p><h2>Email and WhatsApp report</h2></div></div>
          <textarea id="dailyReport" readonly></textarea>
          <div class="actions">
            <button id="copyReport">Copy report</button>
            <a class="btn" id="mailto">Open email</a>
            <a class="btn" id="whatsapp" target="_blank" rel="noreferrer">Open WhatsApp</a>
            <button id="printReport">Print</button>
          </div>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Automatic email</p><h2>Daily email settings</h2></div></div>
          <form class="formgrid" id="emailForm">
            <input name="daily_email_recipients" placeholder="Emails separated by comma">
            <input name="daily_email_time" type="time" value="19:00">
            <button>Save settings</button>
          </form>
          <button id="sendDaily">Send daily email now</button>
          <p class="status" id="emailStatus"></p>
          <div id="emailLogs"></div>
        </div>
      </div>
    </section>
  </main>
  <script>
    const state = { farmers: [], vendors: [], purchases: [], sales: [], rates: [], invoices: [], settings: {}, emailLogs: [] };
    const tabs = [["dashboard","Dashboard"],["masters","Farmers & vendors"],["transactions","Daily entries"],["invoices","Invoices"],["imports","Bulk import/export"],["reports","Reports & email"]];
    const $ = id => document.getElementById(id);
    const rs = v => "Rs " + Math.round(Number(v || 0)).toLocaleString("en-IN");
    const kg = v => Number(v || 0).toLocaleString("en-IN") + " kg";
    const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    const today = new Date().toISOString().slice(0,10);
    $("bizDate").value = today;
    $("month").value = today.slice(0,7);

    $("tabs").innerHTML = tabs.map((t,i) => '<button type="button" class="' + (i ? "" : "active") + '" data-view="' + t[0] + '">' + t[1] + '</button>').join("");
    $("tabs").onclick = e => {
      if (!e.target.dataset.view) return;
      document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("active", b === e.target));
      document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === e.target.dataset.view));
    };

    function options(items, label) {
      return '<option value="">Select ' + label + '</option>' + items.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join("");
    }
    function bananaOptions() { return BANANAS.map(b => '<option>' + b + '</option>').join(""); }
    const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];
    document.querySelectorAll('select[name="banana_type"]').forEach(s => s.innerHTML = bananaOptions());

    async function api(path, body) {
      const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    async function load() {
      const data = await api("/api/state?date=" + $("bizDate").value + "&month=" + $("month").value);
      Object.assign(state, data);
      render();
    }

    function table(headers, rows) {
      if (!rows.length) return '<p class="status">No records yet.</p>';
      return '<div class="tablewrap"><table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join("") + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join("") + '</tr>').join("") + '</tbody></table></div>';
    }

    function dailyText() {
      const d = $("bizDate").value;
      const purchases = state.purchases.filter(x => x.purchase_date === d);
      const sales = state.sales.filter(x => x.sale_date === d);
      const pv = purchases.reduce((a,x) => a + x.weight_kg * x.rate, 0);
      const sv = sales.reduce((a,x) => a + x.weight_kg * x.rate, 0);
      const pending = sales.reduce((a,x) => a + x.weight_kg * x.rate - x.paid, 0);
      return ["Banana Merchant Daily Report - " + d, "Purchase value: " + rs(pv), "Sales value: " + rs(sv), "Pending collection: " + rs(pending), "", "Purchases:", ...purchases.map(x => x.farmer_name + " | " + x.banana_type + " | " + kg(x.weight_kg) + " | " + rs(x.weight_kg * x.rate) + " | " + x.vehicle_no), "", "Sales:", ...sales.map(x => x.vendor_name + " | " + x.banana_type + " | " + kg(x.weight_kg) + " | " + rs(x.weight_kg * x.rate) + " | paid " + rs(x.paid) + " | " + x.vehicle_no)].join("\\n");
    }

    function render() {
      const d = $("bizDate").value;
      const dailyPurchases = state.purchases.filter(x => x.purchase_date === d);
      const dailySales = state.sales.filter(x => x.sale_date === d);
      const pv = dailyPurchases.reduce((a,x) => a + x.weight_kg * x.rate, 0);
      const sv = dailySales.reduce((a,x) => a + x.weight_kg * x.rate, 0);
      const paid = dailySales.reduce((a,x) => a + x.paid, 0);
      const inKg = dailyPurchases.reduce((a,x) => a + x.weight_kg, 0);
      const outKg = dailySales.reduce((a,x) => a + x.weight_kg, 0);
      $("mPurchase").textContent = rs(pv); $("mSales").textContent = rs(sv); $("mMargin").textContent = rs(sv - pv); $("mPending").textContent = rs(sv - paid); $("mStock").textContent = kg(inKg - outKg);
      $("rateCards").innerHTML = BANANAS.map(b => {
        const r = state.rates.find(x => x.rate_date === d && x.banana_type === b);
        const week = state.rates.filter(x => x.banana_type === b).map(x => x.sell_rate);
        const avg = week.reduce((a,n) => a + Number(n), 0) / (week.length || 1);
        return '<article class="rate"><h3>' + b + '</h3><strong>' + (r ? rs(r.sell_rate) : "No rate") + '</strong><span>Buy ' + (r ? rs(r.buy_rate) : "-") + '</span><small>7-day avg sell ' + rs(avg) + '</small></article>';
      }).join("");
      document.querySelector('select[name="farmer_id"]').innerHTML = options(state.farmers, "farmer");
      document.querySelector('select[name="vendor_id"]').innerHTML = options(state.vendors, "vendor");
      document.querySelector('select[name="party_id"]').innerHTML = options(state.farmers, "party");
      $("farmersTable").innerHTML = table(["Name","Phone","Village","GST"], state.farmers.map(x => [x.name,x.phone,x.village,x.gst]));
      $("vendorsTable").innerHTML = table(["Name","Phone","Market","GST"], state.vendors.map(x => [x.name,x.phone,x.market,x.gst]));
      $("recentPurchases").innerHTML = table(["Date","Farmer","Type","Kg","Value","Vehicle"], state.purchases.slice(0,8).map(x => [x.purchase_date,x.farmer_name,x.banana_type,kg(x.weight_kg),rs(x.weight_kg*x.rate),x.vehicle_no]));
      $("recentSales").innerHTML = table(["Date","Vendor","Type","Kg","Value","Pending","Vehicle"], state.sales.slice(0,8).map(x => [x.sale_date,x.vendor_name,x.banana_type,kg(x.weight_kg),rs(x.weight_kg*x.rate),rs(x.weight_kg*x.rate-x.paid),x.vehicle_no]));
      $("transactionTables").innerHTML = "<h3>Purchases</h3>" + table(["Date","Farmer","Type","Bunches","Kg","Rate","Value","Vehicle"], dailyPurchases.map(x => [x.purchase_date,x.farmer_name,x.banana_type,x.bunches,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),x.vehicle_no])) + "<h3>Sales</h3>" + table(["Date","Vendor","Type","Kg","Rate","Value","Paid","Vehicle"], dailySales.map(x => [x.sale_date,x.vendor_name,x.banana_type,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),rs(x.paid),x.vehicle_no]));
      $("invoiceTable").innerHTML = table(["No","Party","Period","Total","Pending","Print"], state.invoices.map(x => [x.invoice_no,x.party_name,x.from_date + " to " + x.to_date,rs(x.total),rs(x.pending),'<a href="/invoice/' + x.id + '" target="_blank">Print</a>']));
      $("dailyReport").value = dailyText();
      $("mailto").href = "mailto:?subject=" + encodeURIComponent("Banana report " + d) + "&body=" + encodeURIComponent($("dailyReport").value);
      $("whatsapp").href = "https://wa.me/?text=" + encodeURIComponent($("dailyReport").value);
      document.querySelector('input[name="daily_email_recipients"]').value = state.settings.daily_email_recipients || "";
      document.querySelector('input[name="daily_email_time"]').value = state.settings.daily_email_time || "19:00";
      $("emailLogs").innerHTML = table(["Date","Recipients","Status","Message"], state.emailLogs.slice(0,8).map(x => [x.report_date,x.recipients,x.status,x.provider_message]));
    }

    function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
    async function save(path, form, extra) { await api(path, Object.assign(formData(form), extra || {})); form.reset(); await load(); }
    $("farmerForm").onsubmit = e => { e.preventDefault(); save("/api/farmers", e.target); };
    $("vendorForm").onsubmit = e => { e.preventDefault(); save("/api/vendors", e.target); };
    $("rateForm").onsubmit = e => { e.preventDefault(); save("/api/rates", e.target, { rate_date: $("bizDate").value }); };
    $("purchaseForm").onsubmit = e => { e.preventDefault(); save("/api/purchases", e.target, { purchase_date: $("bizDate").value }); };
    $("saleForm").onsubmit = e => { e.preventDefault(); save("/api/sales", e.target, { sale_date: $("bizDate").value }); };
    $("invoiceForm").party_type.onchange = e => { document.querySelector('select[name="party_id"]').innerHTML = options(e.target.value === "farmer" ? state.farmers : state.vendors, "party"); };
    $("invoiceForm").from_date.value = today.slice(0,8) + "01"; $("invoiceForm").to_date.value = today;
    $("invoiceForm").onsubmit = async e => { e.preventDefault(); const out = await api("/api/invoices/generate", formData(e.target)); window.open("/invoice/" + out.id, "_blank"); await load(); };
    $("emailForm").onsubmit = async e => { e.preventDefault(); await api("/api/settings", formData(e.target)); $("emailStatus").textContent = "Settings saved."; await load(); };
    $("sendDaily").onclick = async () => { const out = await api("/api/email/send-daily", { report_date: $("bizDate").value }); $("emailStatus").textContent = out.message; await load(); };
    $("refresh").onclick = load; $("bizDate").onchange = load; $("month").onchange = load;
    $("copyReport").onclick = async () => { await navigator.clipboard.writeText($("dailyReport").value); $("copyReport").textContent = "Copied"; setTimeout(() => $("copyReport").textContent = "Copy report", 1200); };
    $("printReport").onclick = () => { const w = window.open("", "_blank"); w.document.write("<pre>" + esc($("dailyReport").value) + "</pre>"); w.print(); };

    function csvParse(text) {
      const rows = []; let row = [], cell = "", q = false;
      for (let i=0;i<text.length;i++) { const c=text[i], n=text[i+1]; if(c==='"'&&q&&n==='"'){cell+='"';i++;} else if(c==='"'){q=!q;} else if(c===","&&!q){row.push(cell);cell="";} else if((c==="\\n"||c==="\\r")&&!q){ if(c==="\\r"&&n==="\\n") i++; row.push(cell); if(row.some(v=>v.trim())) rows.push(row); row=[]; cell=""; } else cell+=c; }
      row.push(cell); if(row.some(v=>v.trim())) rows.push(row); const head = rows.shift().map(h => h.trim()); return rows.map(r => Object.fromEntries(head.map((h,i) => [h, r[i] || ""])));
    }
    $("importForm").onsubmit = async e => { e.preventDefault(); const f = e.target.file.files[0]; const rows = csvParse(await f.text()); const type = e.target.type.value; const out = await api("/api/import", { type, rows }); $("importStatus").textContent = "Imported " + out.count + " " + type + " rows."; e.target.reset(); await load(); };
    document.querySelectorAll("[data-export]").forEach(b => b.onclick = () => { location.href = "/api/export?type=" + b.dataset.export + "&month=" + $("month").value; });
    load().catch(err => { document.body.insertAdjacentHTML("afterbegin", '<div class="notice danger">' + esc(err.message) + '</div>'); });
  </script>
</body>
</html>`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}

function csv(body, filename) {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}

function e(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
}

async function ensureDb(db) {
  await db.batch(TABLES.map((sql) => db.prepare(sql)));
  const count = await db.prepare("SELECT COUNT(*) AS count FROM farmers").first();
  if (Number(count?.count || 0) > 0) return;
  await db.batch([
    db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Kumar Farms", "9876543210", "Pollachi", "North field road"),
    db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Selvi Garden", "9876501234", "Anaimalai", "Canal street"),
    db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Coimbatore Market", "9988776655", "Coimbatore", "Wholesale lane"),
    db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Town Fruit Traders", "8877665544", "Tiruppur", "Market road")
  ]);
  const today = new Date().toISOString().slice(0, 10);
  await db.batch(BANANAS.map((banana, idx) => db.prepare("INSERT INTO banana_rates (rate_date, banana_type, buy_rate, sell_rate) VALUES (?, ?, ?, ?)").bind(today, banana, [42, 28, 36, 58][idx], [49, 34, 43, 67][idx])));
}

async function all(db, sql, ...binds) {
  const result = await db.prepare(sql).bind(...binds).all();
  return result.results || [];
}

async function bodyJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function getState(db, url) {
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const month = url.searchParams.get("month") || currentMonth();
  const monthLike = `${month}-%`;
  const weekStart = new Date(`${date}T00:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const week = weekStart.toISOString().slice(0, 10);
  const [farmers, vendors, rates, purchases, sales, invoices, settingsRows, emailLogs] = await Promise.all([
    all(db, "SELECT * FROM farmers ORDER BY name"),
    all(db, "SELECT * FROM vendors ORDER BY name"),
    all(db, "SELECT * FROM banana_rates WHERE rate_date >= ? ORDER BY rate_date DESC, banana_type", week),
    all(db, "SELECT * FROM purchases WHERE purchase_date LIKE ? ORDER BY purchase_date DESC, id DESC", monthLike),
    all(db, "SELECT * FROM sales WHERE sale_date LIKE ? ORDER BY sale_date DESC, id DESC", monthLike),
    all(db, "SELECT * FROM invoices ORDER BY id DESC LIMIT 50"),
    all(db, "SELECT * FROM settings"),
    all(db, "SELECT * FROM email_logs ORDER BY id DESC LIMIT 20")
  ]);
  const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
  return { date, month, farmers, vendors, rates, purchases, sales, invoices, settings, emailLogs };
}

async function createFarmer(db, input) {
  await db.prepare("INSERT INTO farmers (name, phone, village, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.notes || "").run();
}

async function createVendor(db, input) {
  await db.prepare("INSERT INTO vendors (name, phone, market, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.notes || "").run();
}

async function createRate(db, input) {
  await db.prepare("INSERT INTO banana_rates (rate_date, banana_type, buy_rate, sell_rate) VALUES (?, ?, ?, ?) ON CONFLICT(rate_date, banana_type) DO UPDATE SET buy_rate = excluded.buy_rate, sell_rate = excluded.sell_rate").bind(input.rate_date, input.banana_type, Number(input.buy_rate), Number(input.sell_rate)).run();
}

async function createPurchase(db, input) {
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first();
  await db.prepare("INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(input.purchase_date, Number(input.farmer_id), farmer?.name || "Unknown farmer", input.banana_type, Number(input.bunches || 0), Number(input.weight_kg), Number(input.rate), input.vehicle_no, input.notes || "").run();
}

async function createSale(db, input) {
  const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first();
  await db.prepare("INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(input.sale_date, Number(input.vendor_id), vendor?.name || "Unknown vendor", input.banana_type, Number(input.weight_kg), Number(input.rate), Number(input.paid || 0), input.vehicle_no, input.notes || "").run();
}

async function importRows(db, input) {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  let count = 0;
  for (const row of rows) {
    if (input.type === "farmers" && row.name) {
      await createFarmer(db, row);
      count++;
    } else if (input.type === "vendors" && row.name) {
      await createVendor(db, row);
      count++;
    } else if (input.type === "purchases" && row.purchase_date) {
      await db.prepare("INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(row.purchase_date, Number(row.farmer_id || 0) || null, row.farmer_name || "", row.banana_type, Number(row.bunches || 0), Number(row.weight_kg), Number(row.rate), row.vehicle_no || "", row.notes || "").run();
      count++;
    } else if (input.type === "sales" && row.sale_date) {
      await db.prepare("INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(row.sale_date, Number(row.vendor_id || 0) || null, row.vendor_name || "", row.banana_type, Number(row.weight_kg), Number(row.rate), Number(row.paid || 0), row.vehicle_no || "", row.notes || "").run();
      count++;
    }
  }
  return count;
}

function template(type) {
  const templates = {
    farmers: ["name", "phone", "village", "address", "gst", "notes"],
    vendors: ["name", "phone", "market", "address", "gst", "notes"],
    purchases: ["purchase_date", "farmer_id", "farmer_name", "banana_type", "bunches", "weight_kg", "rate", "vehicle_no", "notes"],
    sales: ["sale_date", "vendor_id", "vendor_name", "banana_type", "weight_kg", "rate", "paid", "vehicle_no", "notes"]
  };
  return templates[type] || templates.farmers;
}

async function exportData(db, type, month) {
  if (type === "farmers") return toCsv(template(type), await all(db, "SELECT name, phone, village, address, gst, notes FROM farmers ORDER BY name"));
  if (type === "vendors") return toCsv(template(type), await all(db, "SELECT name, phone, market, address, gst, notes FROM vendors ORDER BY name"));
  if (type === "sales") return toCsv(template(type), await all(db, "SELECT sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE sale_date LIKE ? ORDER BY sale_date, id", `${month}-%`));
  return toCsv(template("purchases"), await all(db, "SELECT purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE purchase_date LIKE ? ORDER BY purchase_date, id", `${month}-%`));
}

async function generateInvoice(db, input) {
  const partyType = input.party_type === "vendor" ? "vendor" : "farmer";
  const partyId = Number(input.party_id);
  const fromDate = input.from_date;
  const toDate = input.to_date;
  const rows = partyType === "vendor"
    ? await all(db, "SELECT id, sale_date AS item_date, banana_type, weight_kg, rate, paid FROM sales WHERE vendor_id = ? AND sale_date BETWEEN ? AND ? ORDER BY sale_date, id", partyId, fromDate, toDate)
    : await all(db, "SELECT id, purchase_date AS item_date, banana_type, weight_kg, rate, 0 AS paid FROM purchases WHERE farmer_id = ? AND purchase_date BETWEEN ? AND ? ORDER BY purchase_date, id", partyId, fromDate, toDate);
  const party = partyType === "vendor"
    ? await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(partyId).first()
    : await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(partyId).first();
  const total = rows.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const paid = partyType === "vendor" ? rows.reduce((sum, row) => sum + Number(row.paid || 0), 0) : 0;
  const invoiceNo = `${partyType === "vendor" ? "VEND" : "FARM"}-${Date.now()}`;
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const result = await db.prepare("INSERT INTO invoices (invoice_no, party_type, party_id, party_name, from_date, to_date, invoice_date, total, paid, pending, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceNo, partyType, partyId, party?.name || "Unknown", fromDate, toDate, invoiceDate, total, paid, total - paid, total - paid > 0 ? "open" : "paid").run();
  const invoiceId = result.meta.last_row_id;
  for (const row of rows) {
    const amount = Number(row.weight_kg) * Number(row.rate);
    await db.prepare("INSERT INTO invoice_items (invoice_id, item_type, source_id, item_date, description, quantity_kg, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceId, partyType === "vendor" ? "sale" : "purchase", row.id, row.item_date, row.banana_type, Number(row.weight_kg), Number(row.rate), amount).run();
  }
  return invoiceId;
}

async function invoiceHtml(db, id) {
  const invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(Number(id)).first();
  if (!invoice) return html("Invoice not found", 404);
  const items = await all(db, "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_date, id", Number(id));
  const rows = items.map((item) => `<tr><td>${e(item.item_date)}</td><td>${e(item.description)}</td><td>${e(item.quantity_kg)}</td><td>${e(item.rate)}</td><td>${e(item.amount)}</td></tr>`).join("");
  return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>body{font-family:Arial;margin:32px;color:#1f2a24}h1{margin:0 0 8px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:24px 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd5c4;padding:9px;text-align:left}.totals{margin-left:auto;margin-top:20px;width:320px}.actions{margin-bottom:20px}@media print{.actions{display:none}}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><h1>Banana Merchant Invoice</h1><p>${e(invoice.invoice_no)}</p><div class="meta"><div><strong>Party</strong><br>${e(invoice.party_name)} (${e(invoice.party_type)})</div><div><strong>Period</strong><br>${e(invoice.from_date)} to ${e(invoice.to_date)}</div><div><strong>Invoice date</strong><br>${e(invoice.invoice_date)}</div><div><strong>Status</strong><br>${e(invoice.status)}</div></div><table><thead><tr><th>Date</th><th>Description</th><th>Kg</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tr><th>Total</th><td>${e(invoice.total)}</td></tr><tr><th>Paid</th><td>${e(invoice.paid)}</td></tr><tr><th>Pending</th><td>${e(invoice.pending)}</td></tr></table></body></html>`);
}

async function dailyReport(db, reportDate) {
  const purchases = await all(db, "SELECT * FROM purchases WHERE purchase_date = ? ORDER BY id", reportDate);
  const sales = await all(db, "SELECT * FROM sales WHERE sale_date = ? ORDER BY id", reportDate);
  const pv = purchases.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const sv = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const pending = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate) - Number(row.paid), 0);
  return [
    `Banana Merchant Daily Report - ${reportDate}`,
    `Purchase value: Rs ${Math.round(pv).toLocaleString("en-IN")}`,
    `Sales value: Rs ${Math.round(sv).toLocaleString("en-IN")}`,
    `Pending collection: Rs ${Math.round(pending).toLocaleString("en-IN")}`,
    "",
    "Purchases:",
    ...purchases.map((row) => `${row.farmer_name} | ${row.banana_type} | ${row.weight_kg} kg | Rs ${Math.round(Number(row.weight_kg) * Number(row.rate)).toLocaleString("en-IN")} | ${row.vehicle_no}`),
    "",
    "Sales:",
    ...sales.map((row) => `${row.vendor_name} | ${row.banana_type} | ${row.weight_kg} kg | Rs ${Math.round(Number(row.weight_kg) * Number(row.rate)).toLocaleString("en-IN")} | paid Rs ${Math.round(Number(row.paid)).toLocaleString("en-IN")} | ${row.vehicle_no}`)
  ].join("\n");
}

async function sendDailyEmail(db, env, reportDate) {
  const recipients = (await db.prepare("SELECT value FROM settings WHERE key = ?").bind("daily_email_recipients").first())?.value || "";
  const subject = `Banana merchant daily report ${reportDate}`;
  const body = await dailyReport(db, reportDate);
  let status = "draft";
  let message = "Email provider is not configured. Report was saved as a draft log.";
  if (env.RESEND_API_KEY && env.EMAIL_FROM && recipients) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: recipients.split(",").map((x) => x.trim()).filter(Boolean), subject, text: body })
    });
    status = response.ok ? "sent" : "failed";
    message = await response.text();
  }
  await db.prepare("INSERT INTO email_logs (report_date, recipients, subject, body, status, provider_message) VALUES (?, ?, ?, ?, ?, ?)").bind(reportDate, recipients, subject, body, status, message).run();
  return { status, message };
}

async function handleApi(request, env, url) {
  const db = env.DB;
  if (!db) return json({ error: "D1 database binding is missing." }, 500);
  await ensureDb(db);
  const input = request.method === "POST" ? await bodyJson(request) : {};
  if (url.pathname === "/api/state") return json(await getState(db, url));
  if (url.pathname === "/api/farmers") { await createFarmer(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/vendors") { await createVendor(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/rates") { await createRate(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/purchases") { await createPurchase(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/sales") { await createSale(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/import") return json({ count: await importRows(db, input) });
  if (url.pathname === "/api/template") {
    const type = url.searchParams.get("type") || "farmers";
    return csv(template(type).join(",") + "\n", `${type}-template.csv`);
  }
  if (url.pathname === "/api/export") {
    const type = url.searchParams.get("type") || "purchases";
    const month = url.searchParams.get("month") || currentMonth();
    return csv(await exportData(db, type, month), `${type}-${month}.csv`);
  }
  if (url.pathname === "/api/invoices/generate") return json({ id: await generateInvoice(db, input) });
  if (url.pathname === "/api/settings") {
    await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("daily_email_recipients", input.daily_email_recipients || "").run();
    await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("daily_email_time", input.daily_email_time || "19:00").run();
    return json({ ok: true });
  }
  if (url.pathname === "/api/email/send-daily") return json(await sendDailyEmail(db, env, input.report_date || new Date().toISOString().slice(0, 10)));
  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (url.pathname.startsWith("/invoice/")) {
      if (!env.DB) return html("D1 database binding is missing.", 500);
      await ensureDb(env.DB);
      return invoiceHtml(env.DB, url.pathname.split("/").pop());
    }
    return html(APP_HTML);
  },
  async scheduled(_event, env) {
    if (!env.DB) return;
    await ensureDb(env.DB);
    await sendDailyEmail(env.DB, env, new Date().toISOString().slice(0, 10));
  }
};
