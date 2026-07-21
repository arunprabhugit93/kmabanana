const STYLE = `
:root{--bg:#f4f6f3;--ink:#17211b;--muted:#66736a;--panel:#fff;--panel2:#f9fbf7;--line:#dce3d8;--line2:#eef2eb;--brand:#2f6b43;--brand2:#184c2c;--accent:#c9972d;--blue:#315f90;--bad:#b3463c;--ok:#2f7d4c;--shadow:0 16px 40px rgba(23,33,27,.08)}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 92% 8%,rgba(217,173,58,.17),transparent 280px),var(--bg);color:var(--ink);font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px}button,input,select,textarea{font:inherit}button,.btn{align-items:center;background:var(--brand);border:1px solid transparent;border-radius:7px;color:#fff;cursor:pointer;display:inline-flex;font-weight:760;gap:7px;justify-content:center;min-height:38px;padding:9px 13px;text-decoration:none;transition:background .15s,border-color .15s,box-shadow .15s}button:hover,.btn:hover{background:var(--brand2);box-shadow:0 8px 18px rgba(47,107,67,.18)}button.secondary,.btn.secondary{background:#fff;border-color:var(--line);color:var(--ink)}button.secondary:hover,.btn.secondary:hover{background:#f1f5ee;box-shadow:none}button.danger{background:var(--bad);color:#fff}button.small{min-height:30px;padding:5px 9px;font-size:.8rem}input,select,textarea{background:#fff;border:1px solid var(--line);border-radius:7px;color:var(--ink);outline:none;padding:10px 11px;width:100%}input:focus,select:focus,textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(47,107,67,.12)}textarea{min-height:90px;resize:vertical}h1,h2,h3,p{margin:0}.appframe{display:none;grid-template-columns:264px minmax(0,1fr);min-height:100vh}.auth-ready .appframe{display:grid}.authscreen{align-items:center;display:grid;min-height:100vh;padding:24px}.auth-ready .authscreen{display:none}.authcard{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.94));border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:18px;margin:auto;max-width:440px;padding:28px;width:100%}.authbrand{align-items:center;display:flex;gap:12px}.authbrand img{background:#fff;border:1px solid var(--line);border-radius:10px;height:58px;object-fit:contain;padding:5px;width:92px}.authcard h1{font-size:1.75rem;line-height:1.1}.authcopy{color:var(--muted);line-height:1.55}.authform{display:grid;gap:11px}.authform label{color:var(--muted);font-size:.74rem;font-weight:850;text-transform:uppercase}.authpanel{background:#f8faf6;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:.88rem;line-height:1.45;padding:12px}.accountbar{border-top:1px solid rgba(255,255,255,.12);display:grid;gap:10px;margin-top:16px;padding-top:16px}.accountbar span{color:#c7d8cc;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.accountbar .role{color:#9eb4a4;font-size:.72rem;text-transform:uppercase;font-weight:800}.accountbar button{background:transparent;border-color:rgba(255,255,255,.18);color:#dceade;justify-content:flex-start}.sidebar{background:#15291d;color:#dceade;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;overflow:auto}.brand{align-items:center;display:flex;gap:11px;margin-bottom:24px}.logo{background:#fff;border-radius:10px;display:block;height:46px;object-fit:contain;padding:5px;width:76px}.brand strong{display:block;font-size:1.02rem}.brand span{color:#9eb4a4;font-size:.78rem}.tabs{display:grid;gap:6px}.tabs button{background:transparent;border:1px solid transparent;color:#c7d8cc;justify-content:flex-start;padding:10px 12px}.tabs button:hover{background:rgba(255,255,255,.08);box-shadow:none}.tabs button.active{background:#e7f2e9;color:#183823}.sidefoot{border-top:1px solid rgba(255,255,255,.12);color:#98afa0;font-size:.78rem;line-height:1.45;margin-top:auto;padding-top:16px}.shell{max-width:1600px;padding:24px 28px 40px}.topbar{align-items:center;display:grid;gap:18px;grid-template-columns:minmax(0,1fr) 450px;margin-bottom:18px}.titleblock h1{font-size:clamp(1.8rem,3vw,3.1rem);letter-spacing:0;line-height:1.02}.copy{color:var(--muted);font-size:1rem;line-height:1.55;margin-top:10px;max-width:850px}.eyebrow{color:var(--accent);font-size:.72rem;font-weight:850;letter-spacing:0;text-transform:uppercase}.datebox{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:10px;grid-template-columns:1fr 1fr auto;padding:14px}.datebox label{color:var(--muted);font-size:.74rem;font-weight:800;text-transform:uppercase}.datefield{display:grid;gap:5px}.metrics{display:grid;gap:12px;grid-template-columns:repeat(5,minmax(0,1fr));margin:16px 0}.metric{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 22px rgba(23,33,27,.05);display:grid;gap:9px;min-height:104px;padding:16px;position:relative}.metric:before{background:var(--brand);border-radius:10px 0 0 10px;content:"";inset:0 auto 0 0;position:absolute;width:4px}.metric span{color:var(--muted);font-size:.75rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:clamp(1.25rem,2vw,1.85rem);letter-spacing:0}.view{display:none}.view.active{display:block}.grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:1.1fr 1fr 1fr}.panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(255,255,255,.92));border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 28px rgba(23,33,27,.05);padding:18px}.wide{grid-column:1/-1}.heading{align-items:end;display:flex;gap:12px;justify-content:space-between;margin-bottom:14px}.heading h2{font-size:1.2rem;line-height:1.2;margin-top:3px}.subcopy{color:var(--muted);font-size:.86rem;line-height:1.45;margin-top:5px}.formgrid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.formgrid button{align-self:end}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{display:flex;flex-wrap:wrap;gap:9px}.tablewrap{border:1px solid var(--line);border-radius:9px;overflow:auto}table{border-collapse:separate;border-spacing:0;width:100%}th,td{border-bottom:1px solid var(--line2);font-size:.86rem;padding:10px 11px;text-align:left;white-space:nowrap}tr:last-child td{border-bottom:0}th{background:#f6f8f4;color:var(--muted);font-size:.72rem;font-weight:850;position:sticky;text-transform:uppercase;top:0}td:first-child{color:var(--ink);font-weight:780}.num{text-align:right}.pill{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:var(--brand2);display:inline-flex;font-size:.76rem;font-weight:820;padding:4px 8px;text-transform:capitalize}.pill.warn{background:#fff5dc;border-color:#ecd28c;color:#6b4d0d}.pill.bad{background:#fff0ee;border-color:#edc4bf;color:var(--bad)}.rates{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}.rate{background:linear-gradient(180deg,#fbfcf9,#eef5ee);border:1px solid var(--line);border-radius:10px;display:grid;gap:9px;min-height:132px;padding:15px}.rate strong{font-size:1.55rem}.rate span,.rate small{color:var(--muted)}.notice{background:#fff8e8;border:1px solid #ead394;border-radius:9px;color:#61470d;line-height:1.45;padding:12px}.printHint,.status{color:var(--muted);font-size:.86rem;line-height:1.45;min-height:22px}.danger:not(button){color:var(--bad)}.sectiongap{display:grid;gap:12px}.toast{background:#182d20;border-radius:8px;bottom:18px;box-shadow:var(--shadow);color:#fff;display:none;font-weight:760;left:50%;padding:11px 14px;position:fixed;transform:translateX(-50%);z-index:20}.toast.show{display:block}
.modal-backdrop{align-items:center;background:rgba(15,20,16,.55);display:none;inset:0;justify-content:center;padding:20px;position:fixed;z-index:40}.modal-backdrop.show{display:flex}.modal{background:#fff;border-radius:12px;box-shadow:var(--shadow);max-height:88vh;max-width:640px;overflow:auto;padding:20px;width:100%}.modal-head{align-items:center;display:flex;justify-content:space-between;margin-bottom:14px}.modal-head button{background:transparent;border:0;color:var(--muted);font-size:1.3rem;min-height:auto;padding:2px 6px}.balance-due{color:var(--bad);font-weight:800}.balance-clear{color:var(--ok);font-weight:800}.rowline{align-items:center;display:flex;gap:8px}
@media(max-width:1120px){.appframe{grid-template-columns:1fr}.sidebar{height:auto;position:static}.tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.sidefoot{display:none}.topbar,.grid,.grid.three{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rates,.formgrid,.four,.five{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){body{font-size:13px}.shell{padding:14px}.sidebar{padding:14px}.tabs{grid-template-columns:1fr 1fr}.topbar{gap:12px}.datebox,.metrics,.rates,.formgrid,.two,.four,.five{grid-template-columns:1fr}.heading{align-items:start;flex-direction:column}.titleblock h1{font-size:2rem}}
`;

const CLIENT_SCRIPT = `
const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];
const GRADES = ["1st grade", "2nd grade", "3rd grade"];
const state = { farmers: [], vendors: [], vehicles: [], purchases: [], sales: [], rates: [], invoices: [], cutterBatches: [], activityLogs: [], settings: {}, emailLogs: [], farmerPayments: [], trips: [], openTrips: [], stock: [], staff: [], auditLogs: [], me: null };
const ALL_TABS = [["dashboard","Dashboard"],["cutter","Cutter entry"],["masters","Masters"],["transactions","Daily entries"],["trips","Vehicle trips"],["invoices","Invoices"],["imports","Import / Export"],["reports","Reports"],["staff","Staff"],["activity","Activity log"]];
let cutLines = [];
const $ = id => document.getElementById(id);
const rs = v => "Rs " + Math.round(Number(v || 0)).toLocaleString("en-IN");
const kg = v => Number(v || 0).toLocaleString("en-IN") + " kg";
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const todayStr = new Date().toISOString().slice(0,10);
let pendingEmail = "";
$("bizDate").value = todayStr;
$("month").value = todayStr.slice(0,7);

function tabsForRole(role) {
  if (role === "cutter") return ALL_TABS.filter(t => t[0] === "cutter");
  if (role === "owner") return ALL_TABS;
  return ALL_TABS.filter(t => t[0] !== "staff" && t[0] !== "activity");
}
function renderTabs(role) {
  const tabs = tabsForRole(role);
  $("tabs").innerHTML = tabs.map((t,i) => '<button type="button" class="' + (i ? "" : "active") + '" data-view="' + t[0] + '">' + t[1] + '</button>').join("");
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === tabs[0][0]));
}
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
function tripOptions(items) {
  return '<option value="">No trip</option>' + items.map(x => '<option value="' + x.id + '">' + esc(x.trip_date) + ' - ' + esc(x.vehicle_no) + '</option>').join("");
}
function bananaOptions() { return BANANAS.map(b => '<option>' + b + '</option>').join(""); }
function gradeOptions() { return GRADES.map(g => '<option>' + g + '</option>').join(""); }
function gradeOptionsWith(selected) { return GRADES.map(g => '<option' + (g === selected ? " selected" : "") + '>' + g + '</option>').join(""); }
document.querySelectorAll('select[name="banana_type"]').forEach(s => s.innerHTML = bananaOptions());
document.querySelectorAll('select[name="grade"]').forEach(s => s.innerHTML = gradeOptions());

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (res.status === 401) {
    document.body.classList.remove("auth-ready");
    $("authStatus").textContent = "Session expired. Please login again.";
    throw new Error("Login required");
  }
  if (!res.ok) {
    let message = await res.text();
    try { message = JSON.parse(message).error || message; } catch {}
    throw new Error(message);
  }
  return res.json();
}
async function guarded(fn) {
  try { await fn(); } catch (err) { alert(err.message); }
}
function wireRateAutofill(formId, priceField) {
  const form = $(formId);
  const update = () => {
    const r = state.rates.find(x => x.rate_date === $("bizDate").value && x.banana_type === form.banana_type.value && x.grade === form.grade.value);
    if (r) form.rate.value = r[priceField];
  };
  form.banana_type.addEventListener("change", update);
  form.grade.addEventListener("change", update);
}

function setUser(user) {
  document.body.classList.add("auth-ready");
  state.me = user;
  $("userEmail").textContent = user.email || "";
  $("userRole").textContent = user.role || "";
  $("authStatus").textContent = "Logged in.";
  renderTabs(user.role);
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
    raw('<button type="button" class="secondary small" data-remove-line="' + index + '">Remove</button>')
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

// --- generic modal -------------------------------------------------------
function openModal(title, bodyHtml) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = bodyHtml;
  $("modalBackdrop").classList.add("show");
}
function closeModal() { $("modalBackdrop").classList.remove("show"); $("modalBody").innerHTML = ""; }
$("modalClose").onclick = closeModal;
$("modalBackdrop").onclick = e => { if (e.target === $("modalBackdrop")) closeModal(); };

function fld(label, inner) { return '<div class="datefield"><label>' + label + '</label>' + inner + '</div>'; }
function farmerOptionsWith(selected) {
  return state.farmers.map(x => '<option value="' + x.id + '"' + (x.id === selected ? " selected" : "") + '>' + esc(x.name) + '</option>').join("");
}
function vendorOptionsWith(selected) {
  return state.vendors.map(x => '<option value="' + x.id + '"' + (x.id === selected ? " selected" : "") + '>' + esc(x.name) + '</option>').join("");
}
function vehicleOptionsWith(selected) {
  return state.vehicles.map(x => '<option value="' + esc(x.vehicle_no) + '"' + (x.vehicle_no === selected ? " selected" : "") + '>' + esc(x.vehicle_no) + '</option>').join("");
}
function bananaOptionsWith(selected) {
  return BANANAS.map(b => '<option' + (b === selected ? " selected" : "") + '>' + b + '</option>').join("");
}
function tripOptionsWith(selected) {
  return '<option value="">No trip</option>' + state.openTrips.map(x => '<option value="' + x.id + '"' + (x.id === selected ? " selected" : "") + '>' + esc(x.trip_date) + ' - ' + esc(x.vehicle_no) + '</option>').join("");
}

function editFarmer(row) {
  openModal("Edit farmer", '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Name", '<input name="name" value="' + esc(row.name) + '" required>') +
    fld("Phone", '<input name="phone" value="' + esc(row.phone) + '">') +
    fld("Village", '<input name="village" value="' + esc(row.village) + '">') +
    fld("GST / tax id", '<input name="gst" value="' + esc(row.gst) + '">') +
    '</div>' + fld("Address", '<textarea name="address">' + esc(row.address) + '</textarea>') + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/farmers/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Farmer updated"); await load(); }); };
}
function payFarmer(row) {
  openModal("Record payment - " + row.name, '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Date", '<input name="payment_date" type="date" value="' + todayStr + '" required>') +
    fld("Amount", '<input name="amount" type="number" min="0" step="0.01" required>') +
    fld("Mode", '<select name="mode"><option value="cash">Cash</option><option value="bank">Bank transfer</option><option value="upi">UPI</option><option value="other">Other</option></select>') +
    '</div>' + fld("Notes", '<textarea name="notes" placeholder="Advance, weekly settlement, etc."></textarea>') +
    '<button>Save payment</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/farmer-payments", Object.assign({ farmer_id: row.id }, formData(e.target))); closeModal(); showToast("Payment recorded"); await load(); }); };
}
async function viewLedger(row) {
  const data = await api("/api/farmer-ledger?farmer_id=" + row.id);
  const entries = [
    ...data.purchases.map(x => ({ date: x.date, desc: x.banana_type + " purchase (" + kg(x.weight_kg) + " @ " + rs(x.rate) + ")", debit: x.amount, credit: 0 })),
    ...data.payments.map(x => ({ date: x.date, desc: "Payment (" + x.mode + ")" + (x.notes ? " - " + x.notes : ""), debit: 0, credit: x.amount }))
  ].sort((a,b) => a.date < b.date ? -1 : 1);
  let running = 0;
  const rows = entries.map(x => { running += x.debit - x.credit; return [x.date, x.desc, x.debit ? rs(x.debit) : "", x.credit ? rs(x.credit) : "", rs(running)]; });
  const balance = running;
  openModal("Ledger - " + row.name, '<p class="subcopy">Balance owed to farmer: <strong class="' + (balance > 0 ? "balance-due" : "balance-clear") + '">' + rs(balance) + '</strong></p>' + table(["Date","Description","Purchase (debit)","Payment (credit)","Running balance"], rows));
}
function editVendor(row) {
  openModal("Edit vendor", '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Name", '<input name="name" value="' + esc(row.name) + '" required>') +
    fld("Phone", '<input name="phone" value="' + esc(row.phone) + '">') +
    fld("Market", '<input name="market" value="' + esc(row.market) + '">') +
    fld("GST / tax id", '<input name="gst" value="' + esc(row.gst) + '">') +
    '</div>' + fld("Address", '<textarea name="address">' + esc(row.address) + '</textarea>') + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/vendors/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Vendor updated"); await load(); }); };
}
function editPurchase(row) {
  const gross = row.gross_weight_kg || row.weight_kg;
  openModal("Edit purchase", '<form id="mForm" class="sectiongap"><div class="formgrid">' +
    fld("Date", '<input name="purchase_date" type="date" value="' + esc(row.purchase_date) + '" required>') +
    fld("Farmer", '<select name="farmer_id">' + farmerOptionsWith(row.farmer_id) + '</select>') +
    fld("Banana type", '<select name="banana_type">' + bananaOptionsWith(row.banana_type) + '</select>') +
    fld("Grade", '<select name="grade">' + gradeOptionsWith(row.grade) + '</select>') +
    fld("Bunches / units", '<input name="bunches" type="number" min="0" step="0.01" value="' + esc(row.bunches) + '">') +
    fld("Gross weight kg", '<input name="gross_weight_kg" type="number" min="0" step="0.01" value="' + esc(gross) + '" required>') +
    fld("Stem reduction / unit", '<input name="stem_reduction_per_unit" type="number" min="0" step="0.01" value="' + esc(row.stem_reduction_per_unit || 0) + '">') +
    fld("Rate / kg", '<input name="rate" type="number" min="0" step="0.01" value="' + esc(row.rate) + '" required>') +
    fld("Vehicle", '<select name="vehicle_no">' + vehicleOptionsWith(row.vehicle_no) + '</select>') +
    fld("Trip", '<select name="trip_id">' + tripOptionsWith(row.trip_id) + '</select>') +
    '</div>' + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/purchases/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Purchase updated"); await load(); }); };
}
function editSale(row) {
  const gross = row.gross_weight_kg || row.weight_kg;
  openModal("Edit sale", '<form id="mForm" class="sectiongap"><div class="formgrid">' +
    fld("Date", '<input name="sale_date" type="date" value="' + esc(row.sale_date) + '" required>') +
    fld("Vendor", '<select name="vendor_id">' + vendorOptionsWith(row.vendor_id) + '</select>') +
    fld("Banana type", '<select name="banana_type">' + bananaOptionsWith(row.banana_type) + '</select>') +
    fld("Grade", '<select name="grade">' + gradeOptionsWith(row.grade) + '</select>') +
    fld("Bunches / units", '<input name="bunches" type="number" min="0" step="0.01" value="' + esc(row.bunches) + '">') +
    fld("Gross weight kg", '<input name="gross_weight_kg" type="number" min="0" step="0.01" value="' + esc(gross) + '" required>') +
    fld("Stem reduction / unit", '<input name="stem_reduction_per_unit" type="number" min="0" step="0.01" value="' + esc(row.stem_reduction_per_unit || 0) + '">') +
    fld("Rate / kg", '<input name="rate" type="number" min="0" step="0.01" value="' + esc(row.rate) + '" required>') +
    fld("Paid", '<input name="paid" type="number" min="0" step="0.01" value="' + esc(row.paid) + '">') +
    fld("Vehicle", '<select name="vehicle_no">' + vehicleOptionsWith(row.vehicle_no) + '</select>') +
    fld("Trip", '<select name="trip_id">' + tripOptionsWith(row.trip_id) + '</select>') +
    '</div>' + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/sales/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Sale updated"); await load(); }); };
}
async function viewTrip(id) {
  const data = await api("/api/trip-detail?id=" + id);
  const p = data.purchases.reduce((a,x) => a + x.weight_kg * x.rate, 0);
  const s = data.sales.reduce((a,x) => a + x.weight_kg * x.rate, 0);
  const x = data.expenses.reduce((a,e) => a + e.amount, 0);
  const body = '<p class="subcopy">Purchases ' + rs(p) + ' | Sales ' + rs(s) + ' | Expenses ' + rs(x) + ' | Net profit <strong class="' + (s - p - x >= 0 ? "balance-clear" : "balance-due") + '">' + rs(s - p - x) + '</strong></p>' +
    '<h3 style="margin:14px 0 6px">Expenses</h3>' + table(["Type","Amount","Notes","Action"], data.expenses.map(e => [e.expense_type, rs(e.amount), e.notes, raw('<button type="button" class="secondary small" data-del-expense="' + e.id + '">Delete</button>')])) +
    '<form id="mForm" class="formgrid four" style="margin-top:10px"><select name="expense_type"><option value="labor">Labor</option><option value="transport">Transport</option><option value="commission">Commission</option><option value="other">Other</option></select><input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required><input name="notes" placeholder="Notes"><button>Add expense</button></form>' +
    '<h3 style="margin:14px 0 6px">Purchases on this trip</h3>' + table(["Farmer","Type","Kg","Value"], data.purchases.map(x => [x.farmer_name, x.banana_type, kg(x.weight_kg), rs(x.weight_kg*x.rate)])) +
    '<h3 style="margin:14px 0 6px">Sales on this trip</h3>' + table(["Vendor","Type","Kg","Value"], data.sales.map(x => [x.vendor_name, x.banana_type, kg(x.weight_kg), rs(x.weight_kg*x.rate)]));
  openModal("Trip - " + data.trip.vehicle_no + " (" + data.trip.trip_date + ")", body);
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/trip-expenses", Object.assign({ trip_id: id }, formData(e.target))); showToast("Expense added"); await viewTrip(id); await load(); }); };
  $("modalBody").onclick = e => { if (e.target.dataset.delExpense) guarded(async () => { await api("/api/trip-expenses/delete", { id: Number(e.target.dataset.delExpense) }); await viewTrip(id); await load(); }); };
}

async function viewCutterBatch(id) {
  const data = await api("/api/cutter/batch-detail?id=" + id);
  const batch = data.batch;
  const entries = data.entries;
  const pending = batch.status === "pending";
  const totalNet = entries.reduce((a, en) => a + en.net_weight_kg, 0);
  let body = '<p class="subcopy">Status: <span class="pill ' + (batch.status === "pending" ? "warn" : batch.status === "rejected" ? "bad" : "") + '">' + esc(batch.status) + '</span> | Total net: ' + kg(totalNet) + '</p>';
  if (pending) {
    body += '<form id="batchHeaderForm" class="formgrid" style="margin:10px 0">' +
      '<input name="batch_date" type="date" value="' + esc(batch.batch_date) + '" required>' +
      '<select name="farmer_id">' + farmerOptionsWith(batch.farmer_id) + '</select>' +
      '<select name="banana_type">' + bananaOptionsWith(batch.banana_type) + '</select>' +
      '<select name="vehicle_no">' + vehicleOptionsWith(batch.vehicle_no) + '</select>' +
      '<button class="secondary">Save batch details</button></form>';
  } else {
    body += '<p class="subcopy">' + esc(batch.batch_date) + ' | ' + esc(batch.farmer_name) + ' | ' + esc(batch.banana_type) + ' | ' + esc(batch.vehicle_no) + '</p>';
  }
  const lineHeaders = ["Gross kg","Units","Stem/unit","Grade","Net kg","Notes"].concat(pending ? ["Action"] : []);
  body += '<h3 style="margin:14px 0 6px">Weight lines</h3>' + table(lineHeaders, entries.map(en => {
    const row = [kg(en.gross_weight_kg), en.units, en.stem_reduction_per_unit, en.grade, kg(en.net_weight_kg), en.notes];
    if (pending) row.push(raw('<button type="button" class="secondary small" data-edit-entry="' + en.id + '">Edit</button> <button type="button" class="danger small" data-del-entry="' + en.id + '">Delete</button>'));
    return row;
  }));
  if (pending) {
    body += '<form id="addEntryForm" class="formgrid" style="margin-top:10px">' +
      '<input name="gross_weight_kg" type="number" min="0" step="0.01" placeholder="Gross weight kg" required>' +
      '<input name="units" type="number" min="0" step="1" placeholder="Units" required>' +
      '<input name="stem_reduction_per_unit" type="number" min="0" step="0.01" placeholder="Stem reduction / unit">' +
      '<select name="grade">' + gradeOptions() + '</select>' +
      '<input name="notes" placeholder="Notes">' +
      '<button>Add line</button></form>';
    body += '<div class="actions" style="margin-top:14px"><button type="button" id="batchApprove">Approve batch</button><button type="button" class="danger" id="batchReject">Reject batch</button></div>';
  }
  openModal("Cutter batch #" + batch.id, body);
  if (pending) {
    $("batchHeaderForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/cutter/batch/update", Object.assign({ id: batch.id }, formData(e.target))); showToast("Batch updated"); await viewCutterBatch(id); await load(); }); };
    $("addEntryForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/cutter/entry/add", Object.assign({ batch_id: batch.id }, formData(e.target))); showToast("Line added"); await viewCutterBatch(id); await load(); }); };
    $("modalBody").onclick = e => {
      if (e.target.dataset.editEntry) editCutterEntry(entries.find(x => x.id === Number(e.target.dataset.editEntry)), id);
      if (e.target.dataset.delEntry && confirm("Remove this weight line?")) guarded(async () => { await api("/api/cutter/entry/delete", { id: Number(e.target.dataset.delEntry) }); showToast("Line removed"); await viewCutterBatch(id); await load(); });
    };
    $("batchApprove").onclick = () => guarded(async () => { await api("/api/cutter/approve", { id: batch.id }); closeModal(); showToast("Batch approved as purchase"); await load(); });
    $("batchReject").onclick = () => { if (confirm("Reject this batch?")) guarded(async () => { await api("/api/cutter/reject", { id: batch.id }); closeModal(); showToast("Batch rejected"); await load(); }); };
  }
}
function editCutterEntry(entry, batchId) {
  openModal("Edit weight line", '<form id="mForm" class="sectiongap"><div class="formgrid">' +
    fld("Gross weight kg", '<input name="gross_weight_kg" type="number" min="0" step="0.01" value="' + esc(entry.gross_weight_kg) + '" required>') +
    fld("Units", '<input name="units" type="number" min="0" step="1" value="' + esc(entry.units) + '" required>') +
    fld("Stem reduction / unit", '<input name="stem_reduction_per_unit" type="number" min="0" step="0.01" value="' + esc(entry.stem_reduction_per_unit) + '">') +
    fld("Grade", '<select name="grade">' + gradeOptionsWith(entry.grade) + '</select>') +
    '</div>' + fld("Notes", '<textarea name="notes">' + esc(entry.notes) + '</textarea>') +
    '<button>Save line</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/cutter/entry/update", Object.assign({ id: entry.id }, formData(e.target))); showToast("Line updated"); await viewCutterBatch(batchId); await load(); }); };
}

function render() {
  const d = $("bizDate").value;
  const dailyPurchases = state.purchases.filter(x => x.purchase_date === d);
  const dailySales = state.sales.filter(x => x.sale_date === d);
  const pv = dailyPurchases.reduce((a,x) => a + x.weight_kg * x.rate, 0);
  const sv = dailySales.reduce((a,x) => a + x.weight_kg * x.rate, 0);
  const paid = dailySales.reduce((a,x) => a + x.paid, 0);
  const inKg = dailyPurchases.reduce((a,x) => a + x.weight_kg, 0);
  $("mPurchase").textContent = rs(pv); $("mSales").textContent = rs(sv); $("mMargin").textContent = rs(sv - pv); $("mPending").textContent = rs(sv - paid); $("mStock").textContent = kg(inKg - dailySales.reduce((a,x)=>a+x.weight_kg,0));
  $("rateCards").innerHTML = table(["Banana type","Grade","Buy rate","Sell rate"], BANANAS.flatMap(b => GRADES.map(g => {
    const r = state.rates.find(x => x.rate_date === d && x.banana_type === b && x.grade === g);
    return [b, g, r ? rs(r.buy_rate) : "—", r ? rs(r.sell_rate) : "—"];
  })));
  document.querySelectorAll('select[name="farmer_id"]').forEach(s => s.innerHTML = options(state.farmers, "farmer"));
  const vendorSelect = document.querySelector('#saleForm select[name="vendor_id"]');
  if (vendorSelect) vendorSelect.innerHTML = options(state.vendors, "vendor");
  document.querySelectorAll('select[name="vehicle_no"]').forEach(s => s.innerHTML = vehicleOptions(state.vehicles));
  document.querySelectorAll('select[name="trip_id"]').forEach(s => s.innerHTML = tripOptions(state.openTrips));
  const invoiceType = $("invoiceForm").party_type.value;
  document.querySelector('#invoiceForm select[name="party_id"]').innerHTML = options(invoiceType === "vendor" ? state.vendors : state.farmers, "party");
  $("farmersTable").innerHTML = table(["Name","Phone","Village","GST","Balance owed","Actions"], state.farmers.map(x => [
    x.name, x.phone, x.village, x.gst,
    raw('<span class="' + (x.balance > 0 ? "balance-due" : "balance-clear") + '">' + rs(x.balance) + '</span>'),
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-farmer="' + x.id + '">Edit</button> <button type="button" class="secondary small" data-pay-farmer="' + x.id + '">Pay</button> <button type="button" class="secondary small" data-ledger-farmer="' + x.id + '">Ledger</button> <button type="button" class="danger small" data-del-farmer="' + x.id + '">Delete</button></div>')
  ]));
  $("vendorsTable").innerHTML = table(["Name","Phone","Market","GST","Balance due","Actions"], state.vendors.map(x => [
    x.name, x.phone, x.market, x.gst,
    raw('<span class="' + (x.balance > 0 ? "balance-due" : "balance-clear") + '">' + rs(x.balance) + '</span>'),
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-vendor="' + x.id + '">Edit</button> <button type="button" class="danger small" data-del-vendor="' + x.id + '">Delete</button></div>')
  ]));
  $("vehiclesTable").innerHTML = table(["Vehicle","Driver","Phone","Status","Action"], state.vehicles.map(x => [x.vehicle_no,x.driver_name,x.phone,raw('<span class="pill">active</span>'), raw('<button type="button" class="danger small" data-del-vehicle="' + x.id + '">Remove</button>')]));
  $("recentPurchases").innerHTML = table(["Date","Farmer","Type","Kg","Value","Vehicle"], state.purchases.slice(0,8).map(x => [x.purchase_date,x.farmer_name,x.banana_type,kg(x.weight_kg),rs(x.weight_kg*x.rate),x.vehicle_no]));
  $("recentSales").innerHTML = table(["Date","Vendor","Type","Kg","Value","Pending","Vehicle"], state.sales.slice(0,8).map(x => [x.sale_date,x.vendor_name,x.banana_type,kg(x.weight_kg),rs(x.weight_kg*x.rate),rs(x.weight_kg*x.rate-x.paid),x.vehicle_no]));
  $("stockTable").innerHTML = table(["Banana type","Purchased kg (month)","Sold kg (month)","Balance kg"], state.stock.map(x => [x.banana_type, kg(x.purchased_kg), kg(x.sold_kg), raw('<span class="' + (x.balance_kg < 0 ? "balance-due" : "") + '">' + kg(x.balance_kg) + '</span>')]));
  $("workflowHealth").innerHTML = table(["Check","Status"], [
    ["Farmers", raw('<span class="pill">' + state.farmers.length + ' saved</span>')],
    ["Vendors", raw('<span class="pill">' + state.vendors.length + ' saved</span>')],
    ["Vehicles", raw('<span class="pill">' + state.vehicles.length + ' saved</span>')],
    ["Today purchases", raw('<span class="pill">' + dailyPurchases.length + ' entries</span>')],
    ["Pending cutter batches", raw('<span class="pill ' + (state.cutterBatches.some(x => x.status === "pending") ? 'warn' : '') + '">' + state.cutterBatches.filter(x => x.status === "pending").length + ' pending</span>')],
    ["Collections", raw('<span class="pill ' + (sv - paid > 0 ? 'warn' : '') + '">' + rs(sv - paid) + ' pending</span>')],
    ["Farmer balances outstanding", raw('<span class="pill ' + (state.farmers.some(x=>x.balance>0) ? 'warn' : '') + '">' + rs(state.farmers.reduce((a,x)=>a+Math.max(0,x.balance),0)) + '</span>')]
  ]);
  $("cutterLog").innerHTML = table(["Date","Farmer","Banana","Vehicle","Lines","Net kg","Status","Action"], state.cutterBatches.map(x => [
    x.batch_date, x.farmer_name, x.banana_type, x.vehicle_no, x.entry_count, kg(x.total_net_kg),
    raw('<span class="pill ' + (x.status === 'pending' ? 'warn' : x.status === 'rejected' ? 'bad' : '') + '">' + esc(x.status) + '</span>'),
    raw('<div class="actions"><button type="button" class="secondary small" data-view-batch="' + x.id + '">View</button>' + (x.status === "pending" ? ' <button type="button" class="small" data-approve-batch="' + x.id + '">Approve</button> <button type="button" class="danger small" data-reject-batch="' + x.id + '">Reject</button>' : '') + '</div>')
  ]));
  $("transactionTables").innerHTML = "<h3>Purchases</h3>" + table(["Date","Farmer","Type","Grade","Bunches","Kg","Rate","Value","Vehicle","Actions"], dailyPurchases.map(x => [x.purchase_date,x.farmer_name,x.banana_type,x.grade,x.bunches,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),x.vehicle_no,
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-purchase="' + x.id + '">Edit</button> <button type="button" class="danger small" data-del-purchase="' + x.id + '">Delete</button></div>')]))
    + "<h3>Sales</h3>" + table(["Date","Vendor","Type","Grade","Kg","Rate","Value","Paid","Vehicle","Actions"], dailySales.map(x => [x.sale_date,x.vendor_name,x.banana_type,x.grade,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),rs(x.paid),x.vehicle_no,
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-sale="' + x.id + '">Edit</button> <button type="button" class="danger small" data-del-sale="' + x.id + '">Delete</button></div>')]));
  $("invoiceTable").innerHTML = table(["No","Party","Period","Total","Pending","Status","Action"], state.invoices.map(x => [x.invoice_no,x.party_name,x.from_date + " to " + x.to_date,rs(x.total),rs(x.pending),raw('<span class="pill ' + (x.status === 'void' ? 'bad' : x.pending > 0 ? 'warn' : '') + '">' + esc(x.status) + '</span>'),raw('<a class="btn secondary small" href="/invoice/' + x.id + '" target="_blank">Print</a>' + (state.me && state.me.role === "owner" && x.status !== "void" ? ' <button type="button" class="danger small" data-void-invoice="' + x.id + '">Void</button>' : ''))]));
  $("dailyReport").value = dailyText();
  $("mailto").href = "mailto:?subject=" + encodeURIComponent("Banana report " + d) + "&body=" + encodeURIComponent($("dailyReport").value);
  $("whatsapp").href = "https://wa.me/?text=" + encodeURIComponent($("dailyReport").value);
  document.querySelector('input[name="daily_email_recipients"]').value = state.settings.daily_email_recipients || "";
  document.querySelector('input[name="daily_email_time"]').value = state.settings.daily_email_time || "19:00";
  $("emailLogs").innerHTML = table(["Date","Recipients","Status","Message"], state.emailLogs.slice(0,8).map(x => [x.report_date,x.recipients,x.status,x.provider_message]));
  const isOwner = state.me && state.me.role === "owner";
  $("emailForm").style.display = isOwner ? "grid" : "none";
  if (!isOwner) $("emailSettingsHint").textContent = "Only the owner can change email settings.";
  $("tripsTable").innerHTML = table(["Date","Vehicle","Driver","Purchases","Sales","Expenses","Net profit","Status","Action"], state.trips.map(x => [
    x.trip_date, x.vehicle_no, x.driver_name, rs(x.purchase_total), rs(x.sale_total), rs(x.expense_total),
    raw('<span class="' + (x.net_profit >= 0 ? "balance-clear" : "balance-due") + '">' + rs(x.net_profit) + '</span>'),
    raw('<span class="pill ' + (x.status === "settled" ? "" : "warn") + '">' + esc(x.status) + '</span>'),
    raw('<div class="actions"><button type="button" class="secondary small" data-view-trip="' + x.id + '">Open</button>' + (x.status === "open" ? ' <button type="button" class="secondary small" data-settle-trip="' + x.id + '">Settle</button>' : '') + ' <button type="button" class="danger small" data-del-trip="' + x.id + '">Delete</button></div>')
  ]));
  if (state.me && state.me.role === "owner") {
    $("staffTable").innerHTML = table(["Email","Name","Role","Status","Action"], state.staff.map(x => [x.email, x.name, raw('<span class="pill role-pill">' + esc(x.role) + '</span>'), raw('<span class="pill ' + (x.active ? '' : 'bad') + '">' + (x.active ? 'active' : 'inactive') + '</span>'), raw('<button type="button" class="secondary small" data-toggle-staff="' + x.id + '" data-active="' + x.active + '">' + (x.active ? 'Deactivate' : 'Activate') + '</button>')]));
    $("activityTable").innerHTML = table(["When","Entity","Action","By","Details"], state.auditLogs.map(x => [x.created_at, x.entity_type + " #" + x.entity_id, x.action, x.changed_by, raw('<button type="button" class="secondary small" data-view-audit="' + x.id + '">View</button>')]));
  }
  renderCutLines();
}

function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
async function save(path, form, extra) {
  await guarded(async () => {
    await api(path, Object.assign(formData(form), extra || {}));
    form.reset();
    showToast("Saved successfully");
    await load();
  });
}
$("farmerForm").onsubmit = e => { e.preventDefault(); save("/api/farmers", e.target); };
$("vendorForm").onsubmit = e => { e.preventDefault(); save("/api/vendors", e.target); };
$("vehicleForm").onsubmit = e => { e.preventDefault(); save("/api/vehicles", e.target); };
$("rateForm").onsubmit = e => { e.preventDefault(); save("/api/rates", e.target, { rate_date: $("bizDate").value }); };
$("purchaseForm").onsubmit = e => { e.preventDefault(); save("/api/purchases", e.target, { purchase_date: $("bizDate").value }); };
$("saleForm").onsubmit = e => { e.preventDefault(); save("/api/sales", e.target, { sale_date: $("bizDate").value }); };
$("tripForm").onsubmit = e => { e.preventDefault(); save("/api/trips", e.target, { trip_date: $("bizDate").value }); };
$("staffForm").onsubmit = e => { e.preventDefault(); save("/api/staff", e.target); };
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
$("cutterForm").onsubmit = e => {
  e.preventDefault();
  if (!cutLines.length) { showToast("Add at least one weight line"); return; }
  guarded(async () => {
    await api("/api/cutter/submit", Object.assign(formData(e.target), { batch_date: $("bizDate").value, entries: cutLines }));
    cutLines = [];
    e.target.reset();
    renderCutLines();
    showToast("Cutter batch submitted");
    await load();
  });
};
$("cutterLog").onclick = e => {
  const t = e.target.dataset;
  if (t.viewBatch) viewCutterBatch(Number(t.viewBatch));
  if (t.approveBatch) guarded(async () => { await api("/api/cutter/approve", { id: Number(t.approveBatch) }); showToast("Batch approved as purchase"); await load(); });
  if (t.rejectBatch) guarded(async () => { await api("/api/cutter/reject", { id: Number(t.rejectBatch) }); showToast("Batch rejected"); await load(); });
};
$("farmersTable").onclick = e => {
  const t = e.target.dataset;
  if (t.editFarmer) editFarmer(state.farmers.find(x => x.id === Number(t.editFarmer)));
  if (t.payFarmer) payFarmer(state.farmers.find(x => x.id === Number(t.payFarmer)));
  if (t.ledgerFarmer) viewLedger(state.farmers.find(x => x.id === Number(t.ledgerFarmer)));
  if (t.delFarmer && confirm("Delete this farmer? Historical purchases stay on record.")) guarded(async () => { await api("/api/farmers/delete", { id: Number(t.delFarmer) }); showToast("Farmer deleted"); await load(); });
};
$("vendorsTable").onclick = e => {
  const t = e.target.dataset;
  if (t.editVendor) editVendor(state.vendors.find(x => x.id === Number(t.editVendor)));
  if (t.delVendor && confirm("Delete this vendor? Historical sales stay on record.")) guarded(async () => { await api("/api/vendors/delete", { id: Number(t.delVendor) }); showToast("Vendor deleted"); await load(); });
};
$("vehiclesTable").onclick = e => {
  if (e.target.dataset.delVehicle && confirm("Remove this vehicle?")) guarded(async () => { await api("/api/vehicles/delete", { id: Number(e.target.dataset.delVehicle) }); showToast("Vehicle removed"); await load(); });
};
$("transactionTables").onclick = e => {
  const t = e.target.dataset;
  if (t.editPurchase) editPurchase(state.purchases.find(x => x.id === Number(t.editPurchase)));
  if (t.editSale) editSale(state.sales.find(x => x.id === Number(t.editSale)));
  if (t.delPurchase && confirm("Delete this purchase entry?")) guarded(async () => { await api("/api/purchases/delete", { id: Number(t.delPurchase) }); showToast("Purchase deleted"); await load(); });
  if (t.delSale && confirm("Delete this sale entry?")) guarded(async () => { await api("/api/sales/delete", { id: Number(t.delSale) }); showToast("Sale deleted"); await load(); });
};
$("tripsTable").onclick = e => {
  const t = e.target.dataset;
  if (t.viewTrip) viewTrip(Number(t.viewTrip));
  if (t.settleTrip) guarded(async () => { await api("/api/trips/settle", { id: Number(t.settleTrip) }); showToast("Trip settled"); await load(); });
  if (t.delTrip && confirm("Delete this trip? Linked entries stay on record.")) guarded(async () => { await api("/api/trips/delete", { id: Number(t.delTrip) }); showToast("Trip deleted"); await load(); });
};
$("invoiceTable").onclick = e => {
  if (e.target.dataset.voidInvoice && confirm("Void this invoice?")) guarded(async () => { await api("/api/invoices/void", { id: Number(e.target.dataset.voidInvoice) }); showToast("Invoice voided"); await load(); });
};
$("staffTable").onclick = e => {
  if (e.target.dataset.toggleStaff) guarded(async () => { await api("/api/staff/toggle", { id: Number(e.target.dataset.toggleStaff), active: e.target.dataset.active !== "1" }); showToast("Staff updated"); await load(); });
};
$("activityTable").onclick = e => {
  if (e.target.dataset.viewAudit) {
    const row = state.auditLogs.find(x => x.id === Number(e.target.dataset.viewAudit));
    openModal("Audit entry #" + row.id, '<pre style="white-space:pre-wrap;font-size:.82rem">Before:\\n' + esc(row.before_json || "(none)") + '\\n\\nAfter:\\n' + esc(row.after_json || "(none)") + '</pre>');
  }
};
$("invoiceForm").party_type.onchange = e => { document.querySelector('#invoiceForm select[name="party_id"]').innerHTML = options(e.target.value === "vendor" ? state.vendors : state.farmers, "party"); };
$("invoiceForm").from_date.value = todayStr.slice(0,8) + "01"; $("invoiceForm").to_date.value = todayStr;
$("invoiceForm").onsubmit = e => { e.preventDefault(); guarded(async () => { const out = await api("/api/invoices/generate", formData(e.target)); showToast("Invoice generated"); window.open("/invoice/" + out.id, "_blank"); await load(); }); };
$("emailForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/settings", formData(e.target)); $("emailStatus").textContent = "Settings saved."; showToast("Email settings saved"); await load(); }); };
$("sendDaily").onclick = () => guarded(async () => { const out = await api("/api/email/send-daily", { report_date: $("bizDate").value }); $("emailStatus").textContent = out.message; showToast("Daily report logged"); await load(); });
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
$("importForm").onsubmit = e => { e.preventDefault(); guarded(async () => { const f = e.target.file.files[0]; const rows = csvParse(await f.text()); const type = e.target.type.value; const out = await api("/api/import", { type, rows }); $("importStatus").textContent = "Imported " + out.count + " " + type + " rows."; showToast("Import complete"); e.target.reset(); await load(); }); };
document.querySelectorAll("[data-export]").forEach(b => b.onclick = () => { location.href = "/api/export?type=" + b.dataset.export + "&month=" + $("month").value; });
wireRateAutofill("purchaseForm", "buy_rate");
wireRateAutofill("saleForm", "sell_rate");
initAuth().catch(err => { $("authStatus").textContent = err.message; });
`;

const BODY = `
  <section class="authscreen" id="authScreen">
    <div class="authcard">
      <div class="authbrand">
        <img src="/logo.png" alt="KMS Banana logo">
        <div>
          <p class="eyebrow">Secure access</p>
          <h1>KMS Banana Desk</h1>
        </div>
      </div>
      <p class="authcopy">Enter your email address and verify the one-time password to open the merchant workspace. Only emails added under Staff can sign in once an owner account exists.</p>
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
        <span class="role" id="userRole"></span>
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
          <div class="heading"><div><p class="eyebrow">Daily rates</p><h2>Rate board by grade</h2><p class="subcopy">Set the buy and sell rates for the selected business date. 1st/2nd/3rd grade each carry their own price.</p></div></div>
          <div id="rateCards"></div>
          <form class="formgrid five" id="rateForm">
            <select name="banana_type"></select>
            <select name="grade"></select>
            <input name="buy_rate" type="number" min="0" step="0.01" placeholder="Buy rate / kg" required>
            <input name="sell_rate" type="number" min="0" step="0.01" placeholder="Sell rate / kg" required>
            <button>Save rate</button>
          </form>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Recent purchases</p><h2>Farmer loads</h2><p class="subcopy">Latest incoming stock for the selected month.</p></div></div><div id="recentPurchases"></div></div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Recent sales</p><h2>Vendor dispatches</h2><p class="subcopy">Latest sales and collection status.</p></div></div><div id="recentSales"></div></div>
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Stock reconciliation</p><h2>Kg in vs kg out this month</h2><p class="subcopy">A large positive balance may mean unsold stock or spoilage risk; a negative balance usually means a data entry mistake.</p></div></div><div id="stockTable"></div></div>
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Workflow health</p><h2>Today at a glance</h2><p class="subcopy">Quick checks before closing the day.</p></div></div><div id="workflowHealth"></div></div>
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
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Farmers</h2><p class="subcopy">Keep farmer contact, village, GST, notes, and running balance ready for billing and imports.</p></div><a class="btn secondary" href="/api/template?type=farmers">Template</a></div>
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
          <div class="heading"><div><p class="eyebrow">Inbound</p><h2>Purchase from farmer</h2><p class="subcopy">Enter the gross scale weight and grade; stem reduction per unit is subtracted automatically to get the billable net weight. Attach a trip if you're tracking that vehicle's costs.</p></div></div>
          <form class="formgrid" id="purchaseForm">
            <select name="farmer_id" required></select><select name="banana_type"></select><select name="grade"></select>
            <input name="bunches" type="number" min="0" step="0.01" placeholder="Bunches / units"><input name="gross_weight_kg" type="number" min="0" step="0.01" placeholder="Gross weight kg" required><input name="stem_reduction_per_unit" type="number" min="0" step="0.01" placeholder="Stem reduction / unit">
            <input name="rate" type="number" min="0" step="0.01" placeholder="Rate / kg" required><select name="vehicle_no" required></select><select name="trip_id"></select>
            <textarea name="notes" placeholder="Notes"></textarea><button>Save purchase</button>
          </form>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Outbound</p><h2>Sale to vendor</h2><p class="subcopy">Same grade and stem-reduction fields as purchases, plus dispatch weight, sale rate, payment, and vehicle number.</p></div></div>
          <form class="formgrid" id="saleForm">
            <select name="vendor_id" required></select><select name="banana_type"></select><select name="grade"></select>
            <input name="bunches" type="number" min="0" step="0.01" placeholder="Bunches / units"><input name="gross_weight_kg" type="number" min="0" step="0.01" placeholder="Gross weight kg" required><input name="stem_reduction_per_unit" type="number" min="0" step="0.01" placeholder="Stem reduction / unit">
            <input name="rate" type="number" min="0" step="0.01" placeholder="Sale rate / kg" required><input name="paid" type="number" min="0" step="0.01" placeholder="Amount paid"><select name="vehicle_no" required></select>
            <select name="trip_id"></select><textarea name="notes" placeholder="Notes"></textarea><button>Save sale</button>
          </form>
        </div>
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Daily list</p><h2>Purchase and sales records</h2><p class="subcopy">Saved records for the selected business date. Edit or delete to fix mistakes; changes are logged in the Activity log.</p></div></div><div id="transactionTables"></div></div>
      </div>
    </section>

    <section id="trips" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Vehicle costing</p><h2>Open a trip</h2><p class="subcopy">Open a trip for a vehicle, then pick it from the trip dropdown on purchase/sale entries and log labor, transport, or commission expenses against it.</p></div></div>
          <form class="formgrid two" id="tripForm">
            <select name="vehicle_no" required></select>
            <input name="driver_name" placeholder="Driver name">
            <textarea name="notes" placeholder="Notes"></textarea>
            <button>Open trip</button>
          </form>
        </div>
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">This month</p><h2>Trip profit and loss</h2><p class="subcopy">Net profit = sales on the trip minus purchase cost minus logged expenses.</p></div></div><div id="tripsTable"></div></div>
      </div>
    </section>

    <section id="invoices" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Billing</p><h2>Create invoice</h2><p class="subcopy">Generate farmer payable invoices or vendor sales invoices for any date range. Farmer invoices net off payments already recorded in that period.</p></div></div>
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
          <div class="heading"><div><p class="eyebrow">Automatic email</p><h2>Daily email settings</h2><p class="subcopy" id="emailSettingsHint">Configure recipients now; provider credentials can be added later for automatic sending.</p></div></div>
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

    <section id="staff" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Access control</p><h2>Add staff</h2><p class="subcopy">Only emails added here can log in. Owner sees and edits everything, staff can run daily operations, cutter can only submit weights.</p></div></div>
          <form class="formgrid two" id="staffForm">
            <input name="email" type="email" placeholder="Email address" required>
            <input name="name" placeholder="Name">
            <select name="role"><option value="staff">Staff (daily operations)</option><option value="owner">Owner (full access)</option><option value="cutter">Cutter (weight entry only)</option></select>
            <button>Save staff</button>
          </form>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Team</p><h2>Staff accounts</h2></div></div><div id="staffTable"></div></div>
      </div>
    </section>

    <section id="activity" class="view">
      <div class="grid">
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Audit trail</p><h2>Recent changes</h2><p class="subcopy">Every create, edit, delete, and approval is logged with who made it and what changed.</p></div></div><div id="activityTable"></div></div>
      </div>
    </section>
    </main>
  </div>
  <div class="modal-backdrop" id="modalBackdrop">
    <div class="modal">
      <div class="modal-head"><h3 id="modalTitle"></h3><button type="button" id="modalClose">&times;</button></div>
      <div id="modalBody"></div>
    </div>
  </div>
  <div class="toast" id="toast"></div>
`;

export function appShell(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KMS Banana Desk</title>
  <style>${STYLE}</style>
</head>
<body>${BODY}
  <script>${CLIENT_SCRIPT}</script>
</body>
</html>`;
}
