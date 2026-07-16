const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];

const TABLES = [
  "CREATE TABLE IF NOT EXISTS farmers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', village TEXT DEFAULT '', address TEXT DEFAULT '', gst TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '', market TEXT DEFAULT '', address TEXT DEFAULT '', gst TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_no TEXT NOT NULL UNIQUE, driver_name TEXT DEFAULT '', phone TEXT DEFAULT '', notes TEXT DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS banana_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, rate_date TEXT NOT NULL, banana_type TEXT NOT NULL, buy_rate REAL NOT NULL, sell_rate REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(rate_date, banana_type))",
  "CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_date TEXT NOT NULL, farmer_id INTEGER, farmer_name TEXT NOT NULL, banana_type TEXT NOT NULL, bunches REAL NOT NULL DEFAULT 0, weight_kg REAL NOT NULL, rate REAL NOT NULL, vehicle_no TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_date TEXT NOT NULL, vendor_id INTEGER, vendor_name TEXT NOT NULL, banana_type TEXT NOT NULL, weight_kg REAL NOT NULL, rate REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, vehicle_no TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_no TEXT NOT NULL UNIQUE, party_type TEXT NOT NULL, party_id INTEGER NOT NULL, party_name TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, invoice_date TEXT NOT NULL, total REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, pending REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, item_type TEXT NOT NULL, source_id INTEGER NOT NULL, item_date TEXT NOT NULL, description TEXT NOT NULL, quantity_kg REAL NOT NULL, rate REAL NOT NULL, amount REAL NOT NULL)",
  "CREATE TABLE IF NOT EXISTS cutter_batches (id INTEGER PRIMARY KEY AUTOINCREMENT, batch_date TEXT NOT NULL, farmer_id INTEGER NOT NULL, farmer_name TEXT NOT NULL, banana_type TEXT NOT NULL, vehicle_no TEXT NOT NULL, submitted_by TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', approved_at TEXT DEFAULT '', approved_by TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS cutter_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, batch_id INTEGER NOT NULL, gross_weight_kg REAL NOT NULL, units REAL NOT NULL, stem_reduction_per_unit REAL NOT NULL DEFAULT 0, net_weight_kg REAL NOT NULL, grade TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, log_type TEXT NOT NULL, reference_id INTEGER, status TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS email_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, report_date TEXT NOT NULL, recipients TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, provider_message TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS auth_otps (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS auth_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases (purchase_date)",
  "CREATE INDEX IF NOT EXISTS sales_date_idx ON sales (sale_date)",
  "CREATE INDEX IF NOT EXISTS purchases_farmer_idx ON purchases (farmer_id)",
  "CREATE INDEX IF NOT EXISTS sales_vendor_idx ON sales (vendor_id)",
  "CREATE INDEX IF NOT EXISTS invoices_party_idx ON invoices (party_type, party_id)",
  "CREATE INDEX IF NOT EXISTS cutter_batches_status_idx ON cutter_batches (status)",
  "CREATE INDEX IF NOT EXISTS cutter_batches_date_idx ON cutter_batches (batch_date)",
  "CREATE INDEX IF NOT EXISTS cutter_entries_batch_idx ON cutter_entries (batch_id)",
  "CREATE INDEX IF NOT EXISTS auth_otps_email_idx ON auth_otps (email, expires_at)",
  "CREATE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions (token_hash)"
];

const APP_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KMS Banana Desk</title>
  <style>
    :root{--bg:#f4f6f3;--ink:#17211b;--muted:#66736a;--panel:#fff;--panel2:#f9fbf7;--line:#dce3d8;--line2:#eef2eb;--brand:#2f6b43;--brand2:#184c2c;--accent:#c9972d;--blue:#315f90;--bad:#b3463c;--ok:#2f7d4c;--shadow:0 16px 40px rgba(23,33,27,.08)}
    *{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 92% 8%,rgba(217,173,58,.17),transparent 280px),var(--bg);color:var(--ink);font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px}button,input,select,textarea{font:inherit}button,.btn{align-items:center;background:var(--brand);border:1px solid transparent;border-radius:7px;color:#fff;cursor:pointer;display:inline-flex;font-weight:760;gap:7px;justify-content:center;min-height:38px;padding:9px 13px;text-decoration:none;transition:background .15s,border-color .15s,box-shadow .15s}button:hover,.btn:hover{background:var(--brand2);box-shadow:0 8px 18px rgba(47,107,67,.18)}button.secondary,.btn.secondary{background:#fff;border-color:var(--line);color:var(--ink)}button.secondary:hover,.btn.secondary:hover{background:#f1f5ee;box-shadow:none}button.danger{background:var(--bad);color:#fff}input,select,textarea{background:#fff;border:1px solid var(--line);border-radius:7px;color:var(--ink);outline:none;padding:10px 11px;width:100%}input:focus,select:focus,textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(47,107,67,.12)}textarea{min-height:142px;resize:vertical}h1,h2,h3,p{margin:0}.appframe{display:none;grid-template-columns:264px minmax(0,1fr);min-height:100vh}.auth-ready .appframe{display:grid}.authscreen{align-items:center;display:grid;min-height:100vh;padding:24px}.auth-ready .authscreen{display:none}.authcard{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.94));border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:18px;margin:auto;max-width:440px;padding:28px;width:100%}.authbrand{align-items:center;display:flex;gap:12px}.authbrand img{background:#fff;border:1px solid var(--line);border-radius:10px;height:58px;object-fit:contain;padding:5px;width:92px}.authcard h1{font-size:1.75rem;line-height:1.1}.authcopy{color:var(--muted);line-height:1.55}.authform{display:grid;gap:11px}.authform label{color:var(--muted);font-size:.74rem;font-weight:850;text-transform:uppercase}.authpanel{background:#f8faf6;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:.88rem;line-height:1.45;padding:12px}.accountbar{border-top:1px solid rgba(255,255,255,.12);display:grid;gap:10px;margin-top:16px;padding-top:16px}.accountbar span{color:#c7d8cc;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.accountbar button{background:transparent;border-color:rgba(255,255,255,.18);color:#dceade;justify-content:flex-start}.sidebar{background:#15291d;color:#dceade;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh}.brand{align-items:center;display:flex;gap:11px;margin-bottom:24px}.logo{background:#fff;border-radius:10px;display:block;height:46px;object-fit:contain;padding:5px;width:76px}.brand strong{display:block;font-size:1.02rem}.brand span{color:#9eb4a4;font-size:.78rem}.tabs{display:grid;gap:6px}.tabs button{background:transparent;border:1px solid transparent;color:#c7d8cc;justify-content:flex-start;padding:10px 12px}.tabs button:hover{background:rgba(255,255,255,.08);box-shadow:none}.tabs button.active{background:#e7f2e9;color:#183823}.sidefoot{border-top:1px solid rgba(255,255,255,.12);color:#98afa0;font-size:.78rem;line-height:1.45;margin-top:auto;padding-top:16px}.shell{max-width:1600px;padding:24px 28px 40px}.topbar{align-items:center;display:grid;gap:18px;grid-template-columns:minmax(0,1fr) 450px;margin-bottom:18px}.titleblock h1{font-size:clamp(1.8rem,3vw,3.1rem);letter-spacing:0;line-height:1.02}.copy{color:var(--muted);font-size:1rem;line-height:1.55;margin-top:10px;max-width:850px}.eyebrow{color:var(--accent);font-size:.72rem;font-weight:850;letter-spacing:0;text-transform:uppercase}.datebox{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:10px;grid-template-columns:1fr 1fr auto;padding:14px}.datebox label{color:var(--muted);font-size:.74rem;font-weight:800;text-transform:uppercase}.datefield{display:grid;gap:5px}.metrics{display:grid;gap:12px;grid-template-columns:repeat(5,minmax(0,1fr));margin:16px 0}.metric{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 22px rgba(23,33,27,.05);display:grid;gap:9px;min-height:104px;padding:16px;position:relative}.metric:before{background:var(--brand);border-radius:10px 0 0 10px;content:"";inset:0 auto 0 0;position:absolute;width:4px}.metric span{color:var(--muted);font-size:.75rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:clamp(1.25rem,2vw,1.85rem);letter-spacing:0}.view{display:none}.view.active{display:block}.grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:1.1fr 1fr 1fr}.panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(255,255,255,.92));border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 28px rgba(23,33,27,.05);padding:18px}.wide{grid-column:1/-1}.heading{align-items:end;display:flex;gap:12px;justify-content:space-between;margin-bottom:14px}.heading h2{font-size:1.2rem;line-height:1.2;margin-top:3px}.subcopy{color:var(--muted);font-size:.86rem;line-height:1.45;margin-top:5px}.formgrid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.formgrid button{align-self:end}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{display:flex;flex-wrap:wrap;gap:9px}.tablewrap{border:1px solid var(--line);border-radius:9px;overflow:auto}table{border-collapse:separate;border-spacing:0;width:100%}th,td{border-bottom:1px solid var(--line2);font-size:.86rem;padding:10px 11px;text-align:left;white-space:nowrap}tr:last-child td{border-bottom:0}th{background:#f6f8f4;color:var(--muted);font-size:.72rem;font-weight:850;position:sticky;text-transform:uppercase;top:0}td:first-child{color:var(--ink);font-weight:780}.num{text-align:right}.pill{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:var(--brand2);display:inline-flex;font-size:.76rem;font-weight:820;padding:4px 8px}.pill.warn{background:#fff5dc;border-color:#ecd28c;color:#6b4d0d}.pill.bad{background:#fff0ee;border-color:#edc4bf;color:var(--bad)}.rates{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}.rate{background:linear-gradient(180deg,#fbfcf9,#eef5ee);border:1px solid var(--line);border-radius:10px;display:grid;gap:9px;min-height:132px;padding:15px}.rate strong{font-size:1.55rem}.rate span,.rate small{color:var(--muted)}.notice{background:#fff8e8;border:1px solid #ead394;border-radius:9px;color:#61470d;line-height:1.45;padding:12px}.printHint,.status{color:var(--muted);font-size:.86rem;line-height:1.45;min-height:22px}.danger:not(button){color:var(--bad)}.sectiongap{display:grid;gap:12px}.toast{background:#182d20;border-radius:8px;bottom:18px;box-shadow:var(--shadow);color:#fff;display:none;font-weight:760;left:50%;padding:11px 14px;position:fixed;transform:translateX(-50%);z-index:20}.toast.show{display:block}@media(max-width:1120px){.appframe{grid-template-columns:1fr}.sidebar{height:auto;position:static}.tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.sidefoot{display:none}.topbar,.grid,.grid.three{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rates,.formgrid,.four,.five{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){body{font-size:13px}.shell{padding:14px}.sidebar{padding:14px}.tabs{grid-template-columns:1fr 1fr}.topbar{gap:12px}.datebox,.metrics,.rates,.formgrid,.two,.four,.five{grid-template-columns:1fr}.heading{align-items:start;flex-direction:column}.titleblock h1{font-size:2rem}}
  </style>
</head>
<body>
  <section class="authscreen" id="authScreen">
    <div class="authcard">
      <div class="authbrand">
        <img src="/logo.png" alt="KMS Banana logo">
        <div>
          <p class="eyebrow">Secure access</p>
          <h1>KMS Banana Desk</h1>
        </div>
      </div>
      <p class="authcopy">Enter your email address and verify the one-time password to open the merchant workspace.</p>
      <form class="authform" id="loginForm">
        <label for="loginEmail">Email address</label>
        <input id="loginEmail" name="email" type="email" autocomplete="email" placeholder="name@example.com" required>
        <button>Send OTP</button>
      </form>
      <form class="authform" id="otpForm" style="display:none">
        <label for="loginOtp">One-time password</label>
        <input id="loginOtp" name="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 digit OTP" required>
        <button>Login</button>
      </form>
      <div class="authpanel" id="authStatus">Waiting for email verification.</div>
    </div>
  </section>
  <div class="appframe">
    <aside class="sidebar">
      <div class="brand">
        <img class="logo" src="/logo.png" alt="KMS Banana logo">
        <div><strong>KMS Banana</strong><span>Merchant operations suite</span></div>
      </div>
      <nav class="tabs" id="tabs"></nav>
      <div class="accountbar">
        <span id="userEmail"></span>
        <button type="button" id="logout">Logout</button>
      </div>
      <div class="sidefoot">Private beta workspace. Data is stored in the hosted database and reports are generated from saved records.</div>
    </aside>
    <main class="shell">
      <section class="topbar">
        <div class="titleblock">
          <p class="eyebrow">Live operations</p>
          <h1>KMS Banana control desk</h1>
          <p class="copy">Manage farmer purchases, vendor dispatches, invoices, bulk uploads, monthly exports, and daily reports from one production-style workspace.</p>
        </div>
        <div class="datebox">
          <div class="datefield">
            <label for="bizDate">Business date</label>
            <input id="bizDate" type="date">
          </div>
          <div class="datefield">
            <label for="month">Report month</label>
            <input id="month" type="month">
          </div>
          <button id="refresh">Refresh</button>
        </div>
      </section>

    <section class="metrics">
      <article class="metric"><span>Purchase value</span><strong id="mPurchase">Rs 0</strong></article>
      <article class="metric"><span>Sales value</span><strong id="mSales">Rs 0</strong></article>
      <article class="metric"><span>Margin</span><strong id="mMargin">Rs 0</strong></article>
      <article class="metric"><span>Pending collection</span><strong id="mPending">Rs 0</strong></article>
      <article class="metric"><span>Stock balance</span><strong id="mStock">0 kg</strong></article>
    </section>

    <section id="dashboard" class="view active">
      <div class="grid three">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Daily rates</p><h2>Rate board and 7-day averages</h2><p class="subcopy">Set the buy and sell rates used by the counter team for the selected business date.</p></div></div>
          <div class="rates" id="rateCards"></div>
          <form class="formgrid four" id="rateForm">
            <select name="banana_type"></select>
            <input name="buy_rate" type="number" min="0" step="0.01" placeholder="Buy rate / kg" required>
            <input name="sell_rate" type="number" min="0" step="0.01" placeholder="Sell rate / kg" required>
            <button>Save rate</button>
          </form>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Recent purchases</p><h2>Farmer loads</h2><p class="subcopy">Latest incoming stock for the selected month.</p></div></div><div id="recentPurchases"></div></div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Recent sales</p><h2>Vendor dispatches</h2><p class="subcopy">Latest sales and collection status.</p></div></div><div id="recentSales"></div></div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Workflow health</p><h2>Today at a glance</h2><p class="subcopy">Quick checks before closing the day.</p></div></div><div id="workflowHealth"></div></div>
      </div>
    </section>

    <section id="cutter" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Cutter access</p><h2>Submit cutting weights</h2><p class="subcopy">Select farmer, banana type, vehicle and add multiple weight lines. Submitted batches wait for approval before becoming purchase entries.</p></div></div>
          <form class="sectiongap" id="cutterForm">
            <div class="formgrid two">
              <select name="farmer_id" required></select>
              <select name="banana_type"></select>
              <select name="vehicle_no" required></select>
              <input name="submitted_by" placeholder="Cutter name">
            </div>
            <div class="formgrid five">
              <input id="cutWeight" type="number" min="0" step="0.01" placeholder="Weight kg">
              <input id="cutUnits" type="number" min="0" step="1" placeholder="No. of units">
              <input id="cutStem" type="number" min="0" step="0.01" placeholder="Stem reduction / unit">
              <select id="cutGrade"><option>1st grade</option><option>2nd grade</option><option>3rd grade</option></select>
              <button type="button" id="addCutLine">Add line</button>
            </div>
            <div id="cutLines"></div>
            <button>Submit for approval</button>
          </form>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Approval queue</p><h2>Cutter activity log</h2><p class="subcopy">Approve batches after checking weights. Approval creates purchase entries automatically.</p></div></div>
          <div id="cutterLog"></div>
        </div>
      </div>
    </section>

    <section id="masters" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Farmers</h2><p class="subcopy">Keep farmer contact, village, GST, and notes ready for billing and imports.</p></div><a class="btn secondary" href="/api/template?type=farmers">Template</a></div>
          <form class="formgrid two" id="farmerForm">
            <input name="name" placeholder="Farmer name" required><input name="phone" placeholder="Phone">
            <input name="village" placeholder="Village"><input name="gst" placeholder="GST / tax id">
            <textarea name="address" placeholder="Address"></textarea><textarea name="notes" placeholder="Notes"></textarea>
            <button>Save farmer</button>
          </form>
          <div id="farmersTable"></div>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Vendors</h2><p class="subcopy">Maintain market buyers for sales invoices, collections, and monthly reports.</p></div><a class="btn secondary" href="/api/template?type=vendors">Template</a></div>
          <form class="formgrid two" id="vendorForm">
            <input name="name" placeholder="Vendor name" required><input name="phone" placeholder="Phone">
            <input name="market" placeholder="Market"><input name="gst" placeholder="GST / tax id">
            <textarea name="address" placeholder="Address"></textarea><textarea name="notes" placeholder="Notes"></textarea>
            <button>Save vendor</button>
          </form>
          <div id="vendorsTable"></div>
        </div>
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Vehicle list</p><h2>Vehicles</h2><p class="subcopy">Maintain lorry and truck numbers for cutter entries, purchases, and sales.</p></div></div>
          <form class="formgrid four" id="vehicleForm">
            <input name="vehicle_no" placeholder="Vehicle number" required>
            <input name="driver_name" placeholder="Driver name">
            <input name="phone" placeholder="Phone">
            <button>Save vehicle</button>
          </form>
          <div id="vehiclesTable"></div>
        </div>
      </div>
    </section>

    <section id="transactions" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Inbound</p><h2>Purchase from farmer</h2><p class="subcopy">Record vehicle loads as they arrive from farms.</p></div></div>
          <form class="formgrid two" id="purchaseForm">
            <select name="farmer_id" required></select><select name="banana_type"></select>
            <input name="bunches" type="number" min="0" step="0.01" placeholder="Bunches"><input name="weight_kg" type="number" min="0" step="0.01" placeholder="Weight kg" required>
            <input name="rate" type="number" min="0" step="0.01" placeholder="Rate / kg" required><select name="vehicle_no" required></select>
            <textarea name="notes" placeholder="Notes"></textarea><button>Save purchase</button>
          </form>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Outbound</p><h2>Sale to vendor</h2><p class="subcopy">Capture dispatch weight, sale rate, payment, and vehicle number.</p></div></div>
          <form class="formgrid two" id="saleForm">
            <select name="vendor_id" required></select><select name="banana_type"></select>
            <input name="weight_kg" type="number" min="0" step="0.01" placeholder="Weight kg" required><input name="rate" type="number" min="0" step="0.01" placeholder="Sale rate / kg" required>
            <input name="paid" type="number" min="0" step="0.01" placeholder="Amount paid"><select name="vehicle_no" required></select>
            <textarea name="notes" placeholder="Notes"></textarea><button>Save sale</button>
          </form>
        </div>
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Daily list</p><h2>Purchase and sales records</h2><p class="subcopy">Saved records for the selected business date.</p></div></div><div id="transactionTables"></div></div>
      </div>
    </section>

    <section id="invoices" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Billing</p><h2>Create invoice</h2><p class="subcopy">Generate farmer payable invoices or vendor sales invoices for any date range.</p></div></div>
          <form class="formgrid two" id="invoiceForm">
            <select name="party_type"><option value="farmer">Farmer payable invoice</option><option value="vendor">Vendor sales invoice</option></select>
            <select name="party_id"></select>
            <input name="from_date" type="date" required><input name="to_date" type="date" required>
            <button>Generate invoice</button>
          </form>
          <p class="printHint">Each invoice opens as a print-ready page.</p>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Invoices</p><h2>Recent invoices</h2><p class="subcopy">Open any invoice in a print-ready page.</p></div></div><div id="invoiceTable"></div></div>
      </div>
    </section>

    <section id="imports" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Bulk upload</p><h2>Upload Excel-compatible CSV</h2><p class="subcopy">Use templates to load farmers, vendors, purchases, or sales in batches.</p></div></div>
          <div class="notice">Download a template, fill it in Excel, save as CSV, then upload it here. Supported: farmers, vendors, vehicles, purchases, sales.</div>
          <form class="formgrid two" id="importForm">
            <select name="type"><option>farmers</option><option>vendors</option><option>vehicles</option><option>purchases</option><option>sales</option></select>
            <input name="file" type="file" accept=".csv,text/csv" required>
            <button>Upload CSV</button>
          </form>
          <div class="actions">
            <a class="btn secondary" href="/api/template?type=farmers">Farmers template</a>
            <a class="btn secondary" href="/api/template?type=vendors">Vendors template</a>
            <a class="btn secondary" href="/api/template?type=vehicles">Vehicles template</a>
            <a class="btn secondary" href="/api/template?type=purchases">Purchases template</a>
            <a class="btn secondary" href="/api/template?type=sales">Sales template</a>
          </div>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Downloads</p><h2>Monthly Excel files</h2><p class="subcopy">Download master lists or the selected month of purchase and sales records.</p></div></div>
          <div class="actions">
            <button class="secondary" data-export="farmers">Farmers list</button>
            <button class="secondary" data-export="vendors">Vendors list</button>
            <button class="secondary" data-export="vehicles">Vehicles list</button>
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
          <div class="heading"><div><p class="eyebrow">Daily report</p><h2>Email and WhatsApp report</h2><p class="subcopy">Share the daily settlement summary with the team or owner.</p></div></div>
          <textarea id="dailyReport" readonly></textarea>
          <div class="actions">
            <button id="copyReport">Copy report</button>
            <a class="btn" id="mailto">Open email</a>
            <a class="btn" id="whatsapp" target="_blank" rel="noreferrer">Open WhatsApp</a>
            <button id="printReport">Print</button>
          </div>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Automatic email</p><h2>Daily email settings</h2><p class="subcopy">Configure recipients now; provider credentials can be added later for automatic sending.</p></div></div>
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
  </div>
  <div class="toast" id="toast"></div>
  <script>
    const state = { farmers: [], vendors: [], vehicles: [], purchases: [], sales: [], rates: [], invoices: [], cutterBatches: [], activityLogs: [], settings: {}, emailLogs: [] };
    const tabs = [["dashboard","Dashboard"],["cutter","Cutter entry"],["masters","Masters"],["transactions","Daily entries"],["invoices","Invoices"],["imports","Import / Export"],["reports","Reports"]];
    let cutLines = [];
    const $ = id => document.getElementById(id);
    const rs = v => "Rs " + Math.round(Number(v || 0)).toLocaleString("en-IN");
    const kg = v => Number(v || 0).toLocaleString("en-IN") + " kg";
    const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    const today = new Date().toISOString().slice(0,10);
    let pendingEmail = "";
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
    function vehicleOptions(items) {
      return '<option value="">Select vehicle</option>' + items.map(x => '<option value="' + esc(x.vehicle_no) + '">' + esc(x.vehicle_no) + (x.driver_name ? " - " + esc(x.driver_name) : "") + '</option>').join("");
    }
    function bananaOptions() { return BANANAS.map(b => '<option>' + b + '</option>').join(""); }
    const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];
    document.querySelectorAll('select[name="banana_type"]').forEach(s => s.innerHTML = bananaOptions());

    async function api(path, body) {
      const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
      if (res.status === 401) {
        document.body.classList.remove("auth-ready");
        $("authStatus").textContent = "Session expired. Please login again.";
        throw new Error("Login required");
      }
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function setUser(user) {
      document.body.classList.add("auth-ready");
      $("userEmail").textContent = user.email || "";
      $("authStatus").textContent = "Logged in.";
    }

    async function initAuth() {
      const me = await api("/api/auth/me");
      if (!me.authenticated) {
        document.body.classList.remove("auth-ready");
        $("authStatus").textContent = "Enter your email address to receive an OTP.";
        return;
      }
      setUser(me.user);
      await load();
    }

    async function load() {
      const data = await api("/api/state?date=" + $("bizDate").value + "&month=" + $("month").value);
      Object.assign(state, data);
      render();
    }

    function raw(value) { return { raw: value }; }
    function cell(value) { return value && value.raw ? value.raw : esc(value); }
    function table(headers, rows) {
      if (!rows.length) return '<p class="status">No records yet. Add records or upload a CSV template to start.</p>';
      return '<div class="tablewrap"><table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join("") + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + cell(c) + '</td>').join("") + '</tr>').join("") + '</tbody></table></div>';
    }
    function showToast(message) {
      const box = $("toast");
      box.textContent = message;
      box.classList.add("show");
      setTimeout(() => box.classList.remove("show"), 1800);
    }
    function lineNet(line) {
      return Math.max(0, Number(line.weight_kg || 0) - Number(line.units || 0) * Number(line.stem_reduction_per_unit || 0));
    }
    function renderCutLines() {
      $("cutLines").innerHTML = table(["Weight","Units","Stem / unit","Grade","Net kg","Action"], cutLines.map((line, index) => [
        kg(line.weight_kg),
        line.units,
        kg(line.stem_reduction_per_unit).replace(" kg", ""),
        line.grade,
        kg(lineNet(line)),
        raw('<button type="button" class="secondary" data-remove-line="' + index + '">Remove</button>')
      ]));
    }

    function dailyText() {
      const d = $("bizDate").value;
      const purchases = state.purchases.filter(x => x.purchase_date === d);
      const sales = state.sales.filter(x => x.sale_date === d);
      const pv = purchases.reduce((a,x) => a + x.weight_kg * x.rate, 0);
      const sv = sales.reduce((a,x) => a + x.weight_kg * x.rate, 0);
      const pending = sales.reduce((a,x) => a + x.weight_kg * x.rate - x.paid, 0);
      return ["KMS Banana Daily Report - " + d, "Purchase value: " + rs(pv), "Sales value: " + rs(sv), "Pending collection: " + rs(pending), "", "Purchases:", ...purchases.map(x => x.farmer_name + " | " + x.banana_type + " | " + kg(x.weight_kg) + " | " + rs(x.weight_kg * x.rate) + " | " + x.vehicle_no), "", "Sales:", ...sales.map(x => x.vendor_name + " | " + x.banana_type + " | " + kg(x.weight_kg) + " | " + rs(x.weight_kg * x.rate) + " | paid " + rs(x.paid) + " | " + x.vehicle_no)].join("\\n");
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
      document.querySelectorAll('select[name="farmer_id"]').forEach(s => s.innerHTML = options(state.farmers, "farmer"));
      document.querySelector('select[name="vendor_id"]').innerHTML = options(state.vendors, "vendor");
      document.querySelectorAll('select[name="vehicle_no"]').forEach(s => s.innerHTML = vehicleOptions(state.vehicles));
      const invoiceType = $("invoiceForm").party_type.value;
      document.querySelector('select[name="party_id"]').innerHTML = options(invoiceType === "vendor" ? state.vendors : state.farmers, "party");
      $("farmersTable").innerHTML = table(["Name","Phone","Village","GST"], state.farmers.map(x => [x.name,x.phone,x.village,x.gst]));
      $("vendorsTable").innerHTML = table(["Name","Phone","Market","GST"], state.vendors.map(x => [x.name,x.phone,x.market,x.gst]));
      $("vehiclesTable").innerHTML = table(["Vehicle","Driver","Phone","Status"], state.vehicles.map(x => [x.vehicle_no,x.driver_name,x.phone,raw('<span class="pill">' + (x.active ? 'active' : 'inactive') + '</span>')]));
      $("recentPurchases").innerHTML = table(["Date","Farmer","Type","Kg","Value","Vehicle"], state.purchases.slice(0,8).map(x => [x.purchase_date,x.farmer_name,x.banana_type,kg(x.weight_kg),rs(x.weight_kg*x.rate),x.vehicle_no]));
      $("recentSales").innerHTML = table(["Date","Vendor","Type","Kg","Value","Pending","Vehicle"], state.sales.slice(0,8).map(x => [x.sale_date,x.vendor_name,x.banana_type,kg(x.weight_kg),rs(x.weight_kg*x.rate),rs(x.weight_kg*x.rate-x.paid),x.vehicle_no]));
      $("workflowHealth").innerHTML = table(["Check","Status"], [
        ["Farmers", raw('<span class="pill">' + state.farmers.length + ' saved</span>')],
        ["Vendors", raw('<span class="pill">' + state.vendors.length + ' saved</span>')],
        ["Vehicles", raw('<span class="pill">' + state.vehicles.length + ' saved</span>')],
        ["Today purchases", raw('<span class="pill">' + dailyPurchases.length + ' entries</span>')],
        ["Pending cutter batches", raw('<span class="pill ' + (state.cutterBatches.some(x => x.status === "pending") ? 'warn' : '') + '">' + state.cutterBatches.filter(x => x.status === "pending").length + ' pending</span>')],
        ["Collections", raw('<span class="pill ' + (sv - paid > 0 ? 'warn' : '') + '">' + rs(sv - paid) + ' pending</span>')]
      ]);
      $("cutterLog").innerHTML = table(["Date","Farmer","Banana","Vehicle","Lines","Net kg","Status","Action"], state.cutterBatches.map(x => [
        x.batch_date,
        x.farmer_name,
        x.banana_type,
        x.vehicle_no,
        x.entry_count,
        kg(x.total_net_kg),
        raw('<span class="pill ' + (x.status === 'pending' ? 'warn' : x.status === 'rejected' ? 'bad' : '') + '">' + esc(x.status) + '</span>'),
        raw(x.status === "pending" ? '<button type="button" data-approve-batch="' + x.id + '">Approve</button> <button type="button" class="danger" data-reject-batch="' + x.id + '">Reject</button>' : '-')
      ]));
      $("transactionTables").innerHTML = "<h3>Purchases</h3>" + table(["Date","Farmer","Type","Bunches","Kg","Rate","Value","Vehicle"], dailyPurchases.map(x => [x.purchase_date,x.farmer_name,x.banana_type,x.bunches,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),x.vehicle_no])) + "<h3>Sales</h3>" + table(["Date","Vendor","Type","Kg","Rate","Value","Paid","Vehicle"], dailySales.map(x => [x.sale_date,x.vendor_name,x.banana_type,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),rs(x.paid),x.vehicle_no]));
      $("invoiceTable").innerHTML = table(["No","Party","Period","Total","Pending","Status","Action"], state.invoices.map(x => [x.invoice_no,x.party_name,x.from_date + " to " + x.to_date,rs(x.total),rs(x.pending),raw('<span class="pill ' + (x.pending > 0 ? 'warn' : '') + '">' + esc(x.status) + '</span>'),raw('<a class="btn secondary" href="/invoice/' + x.id + '" target="_blank">Print</a>')]));
      $("dailyReport").value = dailyText();
      $("mailto").href = "mailto:?subject=" + encodeURIComponent("Banana report " + d) + "&body=" + encodeURIComponent($("dailyReport").value);
      $("whatsapp").href = "https://wa.me/?text=" + encodeURIComponent($("dailyReport").value);
      document.querySelector('input[name="daily_email_recipients"]').value = state.settings.daily_email_recipients || "";
      document.querySelector('input[name="daily_email_time"]').value = state.settings.daily_email_time || "19:00";
      $("emailLogs").innerHTML = table(["Date","Recipients","Status","Message"], state.emailLogs.slice(0,8).map(x => [x.report_date,x.recipients,x.status,x.provider_message]));
      renderCutLines();
    }

    function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
    async function save(path, form, extra) { await api(path, Object.assign(formData(form), extra || {})); form.reset(); showToast("Saved successfully"); await load(); }
    $("farmerForm").onsubmit = e => { e.preventDefault(); save("/api/farmers", e.target); };
    $("vendorForm").onsubmit = e => { e.preventDefault(); save("/api/vendors", e.target); };
    $("vehicleForm").onsubmit = e => { e.preventDefault(); save("/api/vehicles", e.target); };
    $("rateForm").onsubmit = e => { e.preventDefault(); save("/api/rates", e.target, { rate_date: $("bizDate").value }); };
    $("purchaseForm").onsubmit = e => { e.preventDefault(); save("/api/purchases", e.target, { purchase_date: $("bizDate").value }); };
    $("saleForm").onsubmit = e => { e.preventDefault(); save("/api/sales", e.target, { sale_date: $("bizDate").value }); };
    $("addCutLine").onclick = () => {
      const line = { weight_kg: Number($("cutWeight").value), units: Number($("cutUnits").value), stem_reduction_per_unit: Number($("cutStem").value), grade: $("cutGrade").value };
      if (!line.weight_kg || !line.units) { showToast("Enter weight and units"); return; }
      cutLines.push(line);
      $("cutWeight").value = ""; $("cutUnits").value = ""; $("cutStem").value = "";
      renderCutLines();
    };
    $("cutLines").onclick = e => {
      if (e.target.dataset.removeLine) {
        cutLines.splice(Number(e.target.dataset.removeLine), 1);
        renderCutLines();
      }
    };
    $("cutterForm").onsubmit = async e => {
      e.preventDefault();
      if (!cutLines.length) { showToast("Add at least one weight line"); return; }
      await api("/api/cutter/submit", Object.assign(formData(e.target), { batch_date: $("bizDate").value, entries: cutLines }));
      cutLines = [];
      e.target.reset();
      renderCutLines();
      showToast("Cutter batch submitted");
      await load();
    };
    $("cutterLog").onclick = async e => {
      if (e.target.dataset.approveBatch) {
        await api("/api/cutter/approve", { id: Number(e.target.dataset.approveBatch), approved_by: "Admin" });
        showToast("Batch approved as purchase");
        await load();
      }
      if (e.target.dataset.rejectBatch) {
        await api("/api/cutter/reject", { id: Number(e.target.dataset.rejectBatch), approved_by: "Admin" });
        showToast("Batch rejected");
        await load();
      }
    };
    $("invoiceForm").party_type.onchange = e => { document.querySelector('select[name="party_id"]').innerHTML = options(e.target.value === "farmer" ? state.farmers : state.vendors, "party"); };
    $("invoiceForm").from_date.value = today.slice(0,8) + "01"; $("invoiceForm").to_date.value = today;
    $("invoiceForm").onsubmit = async e => { e.preventDefault(); const out = await api("/api/invoices/generate", formData(e.target)); showToast("Invoice generated"); window.open("/invoice/" + out.id, "_blank"); await load(); };
    $("emailForm").onsubmit = async e => { e.preventDefault(); await api("/api/settings", formData(e.target)); $("emailStatus").textContent = "Settings saved."; showToast("Email settings saved"); await load(); };
    $("sendDaily").onclick = async () => { const out = await api("/api/email/send-daily", { report_date: $("bizDate").value }); $("emailStatus").textContent = out.message; showToast("Daily report logged"); await load(); };
    $("refresh").onclick = load; $("bizDate").onchange = load; $("month").onchange = load;
    $("copyReport").onclick = async () => { await navigator.clipboard.writeText($("dailyReport").value); $("copyReport").textContent = "Copied"; showToast("Report copied"); setTimeout(() => $("copyReport").textContent = "Copy report", 1200); };
    $("printReport").onclick = () => { const w = window.open("", "_blank"); w.document.write("<pre>" + esc($("dailyReport").value) + "</pre>"); w.print(); };
    $("loginForm").onsubmit = async e => {
      e.preventDefault();
      const input = formData(e.target);
      pendingEmail = input.email.trim().toLowerCase();
      const out = await api("/api/auth/request", { email: pendingEmail });
      $("otpForm").style.display = "grid";
      $("loginOtp").focus();
      $("authStatus").textContent = out.dev_otp ? "OTP for testing: " + out.dev_otp : "OTP sent to " + pendingEmail + ".";
    };
    $("otpForm").onsubmit = async e => {
      e.preventDefault();
      const out = await api("/api/auth/verify", { email: pendingEmail, otp: formData(e.target).otp });
      setUser(out.user);
      showToast("Logged in");
      await load();
    };
    $("logout").onclick = async () => {
      await api("/api/auth/logout", {});
      location.reload();
    };

    function csvParse(text) {
      const rows = []; let row = [], cell = "", q = false;
      for (let i=0;i<text.length;i++) { const c=text[i], n=text[i+1]; if(c==='"'&&q&&n==='"'){cell+='"';i++;} else if(c==='"'){q=!q;} else if(c===","&&!q){row.push(cell);cell="";} else if((c==="\\n"||c==="\\r")&&!q){ if(c==="\\r"&&n==="\\n") i++; row.push(cell); if(row.some(v=>v.trim())) rows.push(row); row=[]; cell=""; } else cell+=c; }
      row.push(cell); if(row.some(v=>v.trim())) rows.push(row); const head = rows.shift().map(h => h.trim()); return rows.map(r => Object.fromEntries(head.map((h,i) => [h, r[i] || ""])));
    }
    $("importForm").onsubmit = async e => { e.preventDefault(); const f = e.target.file.files[0]; const rows = csvParse(await f.text()); const type = e.target.type.value; const out = await api("/api/import", { type, rows }); $("importStatus").textContent = "Imported " + out.count + " " + type + " rows."; showToast("Import complete"); e.target.reset(); await load(); };
    document.querySelectorAll("[data-export]").forEach(b => b.onclick = () => { location.href = "/api/export?type=" + b.dataset.export + "&month=" + $("month").value; });
    initAuth().catch(err => { $("authStatus").textContent = err.message; });
  </script>
</body>
</html>`;

function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

function html(body, status = 200, extraHeaders = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(body, {
    status,
    headers
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
  if (Number(count?.count || 0) === 0) {
    await db.batch([
      db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Kumar Farms", "9876543210", "Pollachi", "North field road"),
      db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Selvi Garden", "9876501234", "Anaimalai", "Canal street"),
      db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Coimbatore Market", "9988776655", "Coimbatore", "Wholesale lane"),
      db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Town Fruit Traders", "8877665544", "Tiruppur", "Market road")
    ]);
    const today = new Date().toISOString().slice(0, 10);
    await db.batch(BANANAS.map((banana, idx) => db.prepare("INSERT INTO banana_rates (rate_date, banana_type, buy_rate, sell_rate) VALUES (?, ?, ?, ?)").bind(today, banana, [42, 28, 36, 58][idx], [49, 34, 43, 67][idx])));
  }
  const vehicleCount = await db.prepare("SELECT COUNT(*) AS count FROM vehicles").first();
  if (Number(vehicleCount?.count || 0) === 0) {
    await db.batch([
      db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone) VALUES (?, ?, ?)").bind("TN 38 AB 4421", "Driver 1", ""),
      db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone) VALUES (?, ?, ?)").bind("TN 39 CY 7188", "Driver 2", "")
    ]);
  }
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

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

async function sha256(value) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomDigits(length = 6) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 10 ** length).padStart(length, "0");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isoAfter(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `kms_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return "kms_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

async function currentUser(db, request) {
  const token = cookieValue(request, "kms_session");
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await db.prepare("SELECT email, expires_at FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).first();
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  await db.prepare("UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?").bind(tokenHash).run();
  return { email: session.email };
}

async function sendOtpEmail(env, email, code) {
  const subject = "KMS Banana login OTP";
  const text = `Your KMS Banana login OTP is ${code}. It expires in 10 minutes.`;
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], subject, text })
    });
    return { sent: response.ok, message: await response.text() };
  }
  return { sent: false, message: "Email provider is not configured." };
}

async function requestOtp(db, env, input) {
  const email = String(input.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  const code = randomDigits();
  await db.prepare("INSERT INTO auth_otps (email, code_hash, expires_at) VALUES (?, ?, ?)").bind(email, await sha256(`${email}:${code}`), isoAfter(10)).run();
  const delivery = await sendOtpEmail(env, email, code);
  return json({ ok: true, delivery: delivery.sent ? "sent" : "draft", dev_otp: delivery.sent ? undefined : code });
}

async function verifyOtp(db, input) {
  const email = String(input.email || "").trim().toLowerCase();
  const otp = String(input.otp || "").trim();
  const otpHash = await sha256(`${email}:${otp}`);
  const row = await db.prepare("SELECT id FROM auth_otps WHERE email = ? AND code_hash = ? AND used_at = '' AND expires_at > ? ORDER BY id DESC LIMIT 1").bind(email, otpHash, new Date().toISOString()).first();
  if (!row) return json({ error: "Invalid or expired OTP." }, 401);
  await db.prepare("UPDATE auth_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
  const token = randomToken();
  await db.prepare("INSERT INTO auth_sessions (email, token_hash, expires_at) VALUES (?, ?, ?)").bind(email, await sha256(token), isoAfter(60 * 24 * 30)).run();
  return json({ ok: true, user: { email } }, 200, { "set-cookie": sessionCookie(token) });
}

async function logout(db, request) {
  const token = cookieValue(request, "kms_session");
  if (token) await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
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
  const [farmers, vendors, vehicles, rates, purchases, sales, invoices, cutterBatches, activityLogs, settingsRows, emailLogs] = await Promise.all([
    all(db, "SELECT * FROM farmers ORDER BY name"),
    all(db, "SELECT * FROM vendors ORDER BY name"),
    all(db, "SELECT * FROM vehicles WHERE active = 1 ORDER BY vehicle_no"),
    all(db, "SELECT * FROM banana_rates WHERE rate_date >= ? ORDER BY rate_date DESC, banana_type", week),
    all(db, "SELECT * FROM purchases WHERE purchase_date LIKE ? ORDER BY purchase_date DESC, id DESC", monthLike),
    all(db, "SELECT * FROM sales WHERE sale_date LIKE ? ORDER BY sale_date DESC, id DESC", monthLike),
    all(db, "SELECT * FROM invoices ORDER BY id DESC LIMIT 50"),
    all(db, "SELECT b.*, COUNT(e.id) AS entry_count, COALESCE(SUM(e.gross_weight_kg), 0) AS total_gross_kg, COALESCE(SUM(e.net_weight_kg), 0) AS total_net_kg FROM cutter_batches b LEFT JOIN cutter_entries e ON e.batch_id = b.id WHERE b.batch_date LIKE ? GROUP BY b.id ORDER BY b.id DESC", monthLike),
    all(db, "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 40"),
    all(db, "SELECT * FROM settings"),
    all(db, "SELECT * FROM email_logs ORDER BY id DESC LIMIT 20")
  ]);
  const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
  return { date, month, farmers, vendors, vehicles, rates, purchases, sales, invoices, cutterBatches, activityLogs, settings, emailLogs };
}

async function createFarmer(db, input) {
  await db.prepare("INSERT INTO farmers (name, phone, village, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.notes || "").run();
}

async function createVendor(db, input) {
  await db.prepare("INSERT INTO vendors (name, phone, market, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.notes || "").run();
}

async function createVehicle(db, input) {
  await db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone, notes) VALUES (?, ?, ?, ?) ON CONFLICT(vehicle_no) DO UPDATE SET driver_name = excluded.driver_name, phone = excluded.phone, notes = excluded.notes, active = 1").bind(input.vehicle_no, input.driver_name || "", input.phone || "", input.notes || "").run();
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

function netWeight(entry) {
  return Math.max(0, Number(entry.weight_kg || 0) - Number(entry.units || 0) * Number(entry.stem_reduction_per_unit || 0));
}

async function submitCutterBatch(db, input) {
  const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first();
  const farmerName = farmer?.name || "Unknown farmer";
  const result = await db.prepare("INSERT INTO cutter_batches (batch_date, farmer_id, farmer_name, banana_type, vehicle_no, submitted_by, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')").bind(input.batch_date, Number(input.farmer_id), farmerName, input.banana_type, input.vehicle_no, input.submitted_by || "").run();
  const batchId = result.meta.last_row_id;
  for (const entry of input.entries || []) {
    await db.prepare("INSERT INTO cutter_entries (batch_id, gross_weight_kg, units, stem_reduction_per_unit, net_weight_kg, grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(batchId, Number(entry.weight_kg), Number(entry.units), Number(entry.stem_reduction_per_unit || 0), netWeight(entry), entry.grade || "1st grade", entry.notes || "").run();
  }
  await db.prepare("INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)").bind("cutter_batch", batchId, "pending", `Cutter batch submitted by ${input.submitted_by || "cutter"} for ${farmerName}`).run();
  return batchId;
}

async function approveCutterBatch(db, input) {
  const batch = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(Number(input.id)).first();
  if (!batch) throw new Error("Batch not found");
  if (batch.status !== "pending") return Number(input.id);
  const rate = await db.prepare("SELECT buy_rate FROM banana_rates WHERE rate_date = ? AND banana_type = ?").bind(batch.batch_date, batch.banana_type).first();
  const buyRate = Number(rate?.buy_rate || 0);
  const entries = await all(db, "SELECT * FROM cutter_entries WHERE batch_id = ? ORDER BY id", Number(input.id));
  for (const entry of entries) {
    const notes = `Cutter batch #${batch.id}; ${entry.grade}; gross ${entry.gross_weight_kg} kg; units ${entry.units}; stem reduction ${entry.stem_reduction_per_unit}/unit`;
    await db.prepare("INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(batch.batch_date, batch.farmer_id, batch.farmer_name, batch.banana_type, Number(entry.units), Number(entry.net_weight_kg), buyRate, batch.vehicle_no, notes).run();
  }
  await db.prepare("UPDATE cutter_batches SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?").bind(input.approved_by || "Admin", Number(input.id)).run();
  await db.prepare("INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)").bind("cutter_batch", Number(input.id), "approved", `Cutter batch approved and converted to ${entries.length} purchase entries`).run();
  return Number(input.id);
}

async function rejectCutterBatch(db, input) {
  await db.prepare("UPDATE cutter_batches SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ? AND status = 'pending'").bind(input.approved_by || "Admin", Number(input.id)).run();
  await db.prepare("INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)").bind("cutter_batch", Number(input.id), "rejected", "Cutter batch rejected").run();
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
    } else if (input.type === "vehicles" && row.vehicle_no) {
      await createVehicle(db, row);
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
    vehicles: ["vehicle_no", "driver_name", "phone", "notes"],
    purchases: ["purchase_date", "farmer_id", "farmer_name", "banana_type", "bunches", "weight_kg", "rate", "vehicle_no", "notes"],
    sales: ["sale_date", "vendor_id", "vendor_name", "banana_type", "weight_kg", "rate", "paid", "vehicle_no", "notes"]
  };
  return templates[type] || templates.farmers;
}

async function exportData(db, type, month) {
  if (type === "farmers") return toCsv(template(type), await all(db, "SELECT name, phone, village, address, gst, notes FROM farmers ORDER BY name"));
  if (type === "vendors") return toCsv(template(type), await all(db, "SELECT name, phone, market, address, gst, notes FROM vendors ORDER BY name"));
  if (type === "vehicles") return toCsv(template(type), await all(db, "SELECT vehicle_no, driver_name, phone, notes FROM vehicles ORDER BY vehicle_no"));
  if (type === "sales") return toCsv(template(type), await all(db, "SELECT sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE sale_date LIKE ? ORDER BY sale_date, id", `${month}-%`));
  return toCsv(template("purchases"), await all(db, "SELECT purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE purchase_date LIKE ? ORDER BY purchase_date, id", `${month}-%`));
}

async function generateInvoice(db, input) {
  const partyType = input.party_type === "vendor" ? "vendor" : "farmer";
  const partyId = Number(input.party_id);
  const fromDate = input.from_date;
  const toDate = input.to_date;
  const rows = partyType === "vendor"
    ? await all(db, "SELECT id, sale_date AS item_date, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE vendor_id = ? AND sale_date BETWEEN ? AND ? ORDER BY sale_date, id", partyId, fromDate, toDate)
    : await all(db, "SELECT id, purchase_date AS item_date, banana_type, weight_kg, rate, bunches, vehicle_no, notes, 0 AS paid FROM purchases WHERE farmer_id = ? AND purchase_date BETWEEN ? AND ? ORDER BY purchase_date, id", partyId, fromDate, toDate);
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
    const descriptionParts = [
      row.banana_type,
      row.vehicle_no ? `Vehicle ${row.vehicle_no}` : "",
      partyType === "farmer" && row.bunches ? `Units ${row.bunches}` : "",
      row.notes || ""
    ].filter(Boolean);
    await db.prepare("INSERT INTO invoice_items (invoice_id, item_type, source_id, item_date, description, quantity_kg, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceId, partyType === "vendor" ? "sale" : "purchase", row.id, row.item_date, descriptionParts.join(" | "), Number(row.weight_kg), Number(row.rate), amount).run();
  }
  return invoiceId;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function logoDataUrl(env) {
  try {
    if (!env?.ASSETS) return "/logo.png";
    const response = await env.ASSETS.fetch(new Request("https://assets.local/logo.png"));
    if (!response.ok) return "/logo.png";
    return `data:image/png;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
  } catch (_error) {
    return "/logo.png";
  }
}

async function invoiceLineDescription(db, item) {
  if (item.item_type === "purchase") {
    const source = await db.prepare("SELECT banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE id = ?").bind(Number(item.source_id)).first();
    if (source) {
      return [
        source.banana_type,
        source.vehicle_no ? `Vehicle ${source.vehicle_no}` : "",
        source.bunches ? `Units ${source.bunches}` : "",
        source.notes || ""
      ].filter(Boolean).join(" | ");
    }
  }
  if (item.item_type === "sale") {
    const source = await db.prepare("SELECT banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE id = ?").bind(Number(item.source_id)).first();
    if (source) {
      return [
        source.banana_type,
        source.vehicle_no ? `Vehicle ${source.vehicle_no}` : "",
        source.notes || ""
      ].filter(Boolean).join(" | ");
    }
  }
  return item.description;
}

async function invoiceHtml(db, id, env) {
  const invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(Number(id)).first();
  if (!invoice) return html("Invoice not found", 404);
  const items = await all(db, "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_date, id", Number(id));
  const logoSrc = await logoDataUrl(env);
  const money = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
  const rows = (await Promise.all(items.map(async (item) => {
    const description = await invoiceLineDescription(db, item);
    return `<tr><td>${e(item.item_date)}</td><td>${e(description)}</td><td class="num">${e(item.quantity_kg)}</td><td class="num">${money(item.rate)}</td><td class="num">${money(item.amount)}</td></tr>`;
  }))).join("");
  return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>*{box-sizing:border-box}body{background:radial-gradient(circle at 85% 6%,rgba(255,205,49,.24),transparent 260px),#f4f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;margin:0;padding:28px}.sheet{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,255,255,.94)),radial-gradient(circle at 90% 12%,rgba(255,209,58,.22),transparent 280px);border:1px solid #dce3d8;margin:auto;max-width:920px;overflow:hidden;padding:34px;position:relative}.sheet:after{color:rgba(217,173,58,.08);content:"KMS BANANA";font-size:5rem;font-weight:900;position:absolute;right:-20px;top:44%;transform:rotate(-18deg);z-index:0}.sheet>*{position:relative;z-index:1}.actions{margin:0 auto 16px;max-width:920px}button{background:#2f6b43;border:0;border-radius:7px;color:#fff;font-weight:700;padding:10px 14px}.top{align-items:start;border-bottom:3px solid #2f6b43;display:grid;grid-template-columns:1fr auto;gap:24px;padding-bottom:22px}.brandrow{align-items:center;display:flex;gap:14px}.brandrow img{height:72px;object-fit:contain;width:150px}.brand{font-size:1.8rem;font-weight:900}.muted{color:#66736a}.badge{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:#184c2c;display:inline-block;font-size:.78rem;font-weight:800;margin-top:8px;padding:5px 10px;text-transform:uppercase}.meta{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px;margin:24px 0}.box{border:1px solid #dce3d8;border-radius:8px;padding:14px}.label{color:#66736a;font-size:.72rem;font-weight:800;text-transform:uppercase}.value{font-size:1rem;font-weight:800;margin-top:5px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e8ede4;padding:11px 9px;text-align:left}th{background:#f6f8f4;color:#66736a;font-size:.72rem;text-transform:uppercase}.num{text-align:right}.totals{margin-left:auto;margin-top:24px;width:340px}.totals td,.totals th{border:1px solid #dce3d8}.totals .due{background:#fff7df;font-size:1.05rem}.footer{border-top:1px solid #dce3d8;color:#66736a;font-size:.85rem;margin-top:34px;padding-top:14px}@media print{body{background:#fff;padding:0}.actions{display:none}.sheet{border:0;max-width:none;padding:20px}}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet"><section class="top"><div class="brandrow"><img src="${logoSrc}" alt="KMS Banana logo"><div><div class="brand">KMS Banana</div><p class="muted">Banana merchant purchase and sales billing</p></div></div><div><h1>Invoice</h1><p class="muted">${e(invoice.invoice_no)}</p><span class="badge">${e(invoice.status)}</span></div></section><section class="meta"><div class="box"><div class="label">Party</div><div class="value">${e(invoice.party_name)}</div><p class="muted">${e(invoice.party_type)} invoice</p></div><div class="box"><div class="label">Invoice date</div><div class="value">${e(invoice.invoice_date)}</div></div><div class="box"><div class="label">Period</div><div class="value">${e(invoice.from_date)} to ${e(invoice.to_date)}</div></div></section><table><thead><tr><th>Date</th><th>Description</th><th class="num">Kg</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table><p class="footer">Generated from saved purchase and sales records in KMS Banana Desk.</p></main></body></html>`);
}

async function dailyReport(db, reportDate) {
  const purchases = await all(db, "SELECT * FROM purchases WHERE purchase_date = ? ORDER BY id", reportDate);
  const sales = await all(db, "SELECT * FROM sales WHERE sale_date = ? ORDER BY id", reportDate);
  const pv = purchases.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const sv = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
  const pending = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate) - Number(row.paid), 0);
  return [
    `KMS Banana Daily Report - ${reportDate}`,
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
  if (url.pathname === "/api/auth/me") {
    const user = await currentUser(db, request);
    return json({ authenticated: Boolean(user), user });
  }
  if (url.pathname === "/api/auth/request") return requestOtp(db, env, input);
  if (url.pathname === "/api/auth/verify") return verifyOtp(db, input);
  if (url.pathname === "/api/auth/logout") return logout(db, request);
  const user = await currentUser(db, request);
  if (!user) return json({ error: "Login required" }, 401);
  if (url.pathname === "/api/state") return json(await getState(db, url));
  if (url.pathname === "/api/farmers") { await createFarmer(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/vendors") { await createVendor(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/vehicles") { await createVehicle(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/rates") { await createRate(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/purchases") { await createPurchase(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/sales") { await createSale(db, input); return json({ ok: true }); }
  if (url.pathname === "/api/cutter/submit") return json({ id: await submitCutterBatch(db, input) });
  if (url.pathname === "/api/cutter/approve") return json({ id: await approveCutterBatch(db, input) });
  if (url.pathname === "/api/cutter/reject") { await rejectCutterBatch(db, input); return json({ ok: true }); }
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
    if (url.pathname === "/logo.png" && env.ASSETS) return env.ASSETS.fetch(request);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (url.pathname.startsWith("/invoice/")) {
      if (!env.DB) return html("D1 database binding is missing.", 500);
      await ensureDb(env.DB);
      const user = await currentUser(env.DB, request);
      if (!user) return html('<!doctype html><html><head><meta charset="utf-8"><title>Login required</title></head><body><p>Login required. Open the KMS Banana Desk and verify your email OTP before printing invoices.</p></body></html>', 401);
      return invoiceHtml(env.DB, url.pathname.split("/").pop(), env);
    }
    return html(APP_HTML);
  },
  async scheduled(_event, env) {
    if (!env.DB) return;
    await ensureDb(env.DB);
    await sendDailyEmail(env.DB, env, new Date().toISOString().slice(0, 10));
  }
};
