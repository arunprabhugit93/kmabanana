const STYLE = `
:root{--bg:#f4f6f3;--ink:#17211b;--muted:#66736a;--panel:#fff;--panel2:#f9fbf7;--line:#dce3d8;--line2:#eef2eb;--brand:#2f6b43;--brand2:#184c2c;--accent:#c9972d;--blue:#315f90;--bad:#b3463c;--ok:#2f7d4c;--shadow:0 16px 40px rgba(23,33,27,.08)}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 92% 8%,rgba(217,173,58,.17),transparent 280px),var(--bg);color:var(--ink);font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px}button,input,select,textarea{font:inherit}button,.btn{align-items:center;background:var(--brand);border:1px solid transparent;border-radius:7px;color:#fff;cursor:pointer;display:inline-flex;font-weight:760;gap:7px;justify-content:center;min-height:38px;padding:9px 13px;text-decoration:none;transition:background .15s,border-color .15s,box-shadow .15s}button:hover,.btn:hover{background:var(--brand2);box-shadow:0 8px 18px rgba(47,107,67,.18)}button.secondary,.btn.secondary{background:#fff;border-color:var(--line);color:var(--ink)}button.secondary:hover,.btn.secondary:hover{background:#f1f5ee;box-shadow:none}button.danger{background:var(--bad);color:#fff}button.small{min-height:30px;padding:5px 9px;font-size:.8rem}input,select,textarea{background:#fff;border:1px solid var(--line);border-radius:7px;color:var(--ink);outline:none;padding:10px 11px;width:100%}input:focus,select:focus,textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(47,107,67,.12)}textarea{min-height:80px;resize:vertical}h1,h2,h3,p{margin:0}.appframe{display:none;grid-template-columns:264px minmax(0,1fr);min-height:100vh}.auth-ready .appframe{display:grid}.authscreen{align-items:center;display:grid;min-height:100vh;padding:24px}.auth-ready .authscreen{display:none}.authcard{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.94));border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:18px;margin:auto;max-width:440px;padding:28px;width:100%}.authbrand{align-items:center;display:flex;gap:12px}.authbrand img{background:#fff;border:1px solid var(--line);border-radius:10px;height:58px;object-fit:contain;padding:5px;width:92px}.authcard h1{font-size:1.75rem;line-height:1.1}.authcopy{color:var(--muted);line-height:1.55}.authform{display:grid;gap:11px}.authform label{color:var(--muted);font-size:.74rem;font-weight:850;text-transform:uppercase}.authpanel{background:#f8faf6;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:.88rem;line-height:1.45;padding:12px}.accountbar{border-top:1px solid rgba(255,255,255,.12);display:grid;gap:10px;margin-top:16px;padding-top:16px}.accountbar span{color:#c7d8cc;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.accountbar .role{color:#9eb4a4;font-size:.72rem;text-transform:uppercase;font-weight:800}.accountbar button{background:transparent;border-color:rgba(255,255,255,.18);color:#dceade;justify-content:flex-start}.sidebar{background:#15291d;color:#dceade;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;overflow:auto}.brand{align-items:center;display:flex;gap:11px;margin-bottom:24px}.logo{background:#fff;border-radius:10px;display:block;height:46px;object-fit:contain;padding:5px;width:76px}.brand strong{display:block;font-size:1.02rem}.brand span{color:#9eb4a4;font-size:.78rem}.tabs{display:grid;gap:6px}.tabs button{background:transparent;border:1px solid transparent;color:#c7d8cc;justify-content:flex-start;padding:10px 12px}.tabs button:hover{background:rgba(255,255,255,.08);box-shadow:none}.tabs button.active{background:#e7f2e9;color:#183823}.sidefoot{border-top:1px solid rgba(255,255,255,.12);color:#98afa0;font-size:.78rem;line-height:1.45;margin-top:auto;padding-top:16px}.shell{max-width:1600px;padding:24px 28px 40px}.topbar{align-items:center;display:grid;gap:18px;grid-template-columns:minmax(0,1fr) 320px;margin-bottom:18px}.titleblock h1{font-size:clamp(1.8rem,3vw,3.1rem);letter-spacing:0;line-height:1.02}.copy{color:var(--muted);font-size:1rem;line-height:1.55;margin-top:10px;max-width:850px}.eyebrow{color:var(--accent);font-size:.72rem;font-weight:850;letter-spacing:0;text-transform:uppercase}.datebox{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:10px;grid-template-columns:1fr auto;padding:14px}.datebox label{color:var(--muted);font-size:.74rem;font-weight:800;text-transform:uppercase}.datefield{display:grid;gap:5px}.metrics{display:grid;gap:12px;grid-template-columns:repeat(5,minmax(0,1fr));margin:16px 0}.metric{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 22px rgba(23,33,27,.05);display:grid;gap:9px;min-height:104px;padding:16px;position:relative}.metric:before{background:var(--brand);border-radius:10px 0 0 10px;content:"";inset:0 auto 0 0;position:absolute;width:4px}.metric span{color:var(--muted);font-size:.75rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:clamp(1.1rem,2vw,1.6rem);letter-spacing:0}.view{display:none}.view.active{display:block}.grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:1.1fr 1fr 1fr}.panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(255,255,255,.92));border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 28px rgba(23,33,27,.05);padding:18px}.wide{grid-column:1/-1}.heading{align-items:end;display:flex;gap:12px;justify-content:space-between;margin-bottom:14px}.heading h2{font-size:1.2rem;line-height:1.2;margin-top:3px}.subcopy{color:var(--muted);font-size:.86rem;line-height:1.45;margin-top:5px}.formgrid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.formgrid button{align-self:end}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{display:flex;flex-wrap:wrap;gap:9px}.tablewrap{border:1px solid var(--line);border-radius:9px;overflow:auto}table{border-collapse:separate;border-spacing:0;width:100%}th,td{border-bottom:1px solid var(--line2);font-size:.86rem;padding:10px 11px;text-align:left;white-space:nowrap}tr:last-child td{border-bottom:0}th{background:#f6f8f4;color:var(--muted);font-size:.72rem;font-weight:850;position:sticky;text-transform:uppercase;top:0}td:first-child{color:var(--ink);font-weight:780}.num{text-align:right}.pill{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:var(--brand2);display:inline-flex;font-size:.76rem;font-weight:820;padding:4px 8px;text-transform:capitalize}.pill.warn{background:#fff5dc;border-color:#ecd28c;color:#6b4d0d}.pill.bad{background:#fff0ee;border-color:#edc4bf;color:var(--bad)}.notice{background:#fff8e8;border:1px solid #ead394;border-radius:9px;color:#61470d;line-height:1.45;padding:12px}.printHint,.status{color:var(--muted);font-size:.86rem;line-height:1.45;min-height:22px}.danger:not(button){color:var(--bad)}.sectiongap{display:grid;gap:12px}.toast{background:#182d20;border-radius:8px;bottom:18px;box-shadow:var(--shadow);color:#fff;display:none;font-weight:760;left:50%;padding:11px 14px;position:fixed;transform:translateX(-50%);z-index:20}.toast.show{display:block}
.modal-backdrop{align-items:center;background:rgba(15,20,16,.55);display:none;inset:0;justify-content:center;padding:20px;position:fixed;z-index:40}.modal-backdrop.show{display:flex}.modal{background:#fff;border-radius:12px;box-shadow:var(--shadow);max-height:88vh;max-width:640px;overflow:auto;padding:20px;width:100%}.modal-head{align-items:center;display:flex;justify-content:space-between;margin-bottom:14px}.modal-head button{background:transparent;border:0;color:var(--muted);font-size:1.3rem;min-height:auto;padding:2px 6px}.balance-due{color:var(--bad);font-weight:800}.balance-clear{color:var(--ok);font-weight:800}
.subtabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.subtabs button{background:#fff;border:1px solid var(--line);color:var(--muted);min-height:32px;padding:7px 13px}.subtabs button.active{background:var(--brand);border-color:transparent;color:#fff}.subview{display:none}.subview.active{display:block}
@media(max-width:1120px){.appframe{grid-template-columns:1fr}.sidebar{height:auto;position:static}.tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.sidefoot{display:none}.topbar,.grid,.grid.three{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.formgrid,.four,.five{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){body{font-size:13px}.shell{padding:14px}.sidebar{padding:14px}.tabs{grid-template-columns:1fr 1fr}.topbar{gap:12px}.datebox,.metrics,.formgrid,.two,.four,.five{grid-template-columns:1fr}.heading{align-items:start;flex-direction:column}.titleblock h1{font-size:2rem}}
`;

const CLIENT_SCRIPT = `
const GRADES = ["1st grade", "2nd grade", "3rd grade"];
const state = { farmers: [], vendors: [], vehicles: [], bananaTypes: [], rates: [], purchaseInvoices: [], saleInvoices: [], settings: {}, emailLogs: [], staff: [], auditLogs: [], me: null };
const ALL_TABS = [["purchase","Purchase Invoice"],["sale","Sales Invoice"],["invoices","Invoices"],["masters","Masters"],["rates","Rates & Reports"],["staff","Staff"],["activity","Activity log"]];
const $ = id => document.getElementById(id);
const rs = v => "Rs " + Math.round(Number(v || 0)).toLocaleString("en-IN");
const kg = v => Number(v || 0).toLocaleString("en-IN") + " kg";
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const todayStr = new Date().toISOString().slice(0,10);
let pendingEmail = "";
$("month").value = todayStr.slice(0,7);

function tabsForRole(role) {
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
document.querySelectorAll("[data-subtabs]").forEach(group => {
  group.onclick = e => {
    if (!e.target.dataset.subview) return;
    group.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === e.target));
    group.parentElement.querySelectorAll(".subview").forEach(v => v.classList.toggle("active", v.id === e.target.dataset.subview));
  };
});

function farmerOptions() { return '<option value="">Select farmer</option>' + state.farmers.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join(""); }
function vendorOptions() { return '<option value="">Select buyer</option>' + state.vendors.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join(""); }
function vehicleOptions() { return '<option value="">Select vehicle</option>' + state.vehicles.map(x => '<option value="' + esc(x.vehicle_no) + '">' + esc(x.vehicle_no) + (x.driver_name ? " - " + esc(x.driver_name) : "") + '</option>').join(""); }
function bananaOptions() { return state.bananaTypes.map(x => '<option>' + esc(x.name) + '</option>').join(""); }
function gradeOptions() { return GRADES.map(g => '<option>' + g + '</option>').join(""); }
function farmerOptionsWith(sel) { return state.farmers.map(x => '<option value="' + x.id + '"' + (x.id === sel ? " selected" : "") + '>' + esc(x.name) + '</option>').join(""); }
function vendorOptionsWith(sel) { return state.vendors.map(x => '<option value="' + x.id + '"' + (x.id === sel ? " selected" : "") + '>' + esc(x.name) + '</option>').join(""); }
function bananaOptionsWith(sel) { return state.bananaTypes.map(x => '<option' + (x.name === sel ? " selected" : "") + '>' + esc(x.name) + '</option>').join(""); }
function gradeOptionsWith(sel) { return GRADES.map(g => '<option' + (g === sel ? " selected" : "") + '>' + g + '</option>').join(""); }
// Keeps a <select>'s current choice across a full option-list refresh
// instead of silently resetting to the first option (which used to break
// rate auto-suggest whenever new data loaded, e.g. after adding a banana type).
function refreshSelectPreservingValue(id, optionsWithFn) {
  const el = $(id);
  const current = el.value;
  el.innerHTML = optionsWithFn(current);
}

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
function describeSend(out) {
  const parts = [];
  parts.push(out.email ? "Email: " + (out.email.sent ? "sent" : out.email.message) : "Email: no address on file");
  parts.push(out.whatsapp ? "WhatsApp: " + (out.whatsapp.sent ? "sent" : out.whatsapp.message) : "WhatsApp: no number on file");
  return parts.join(" | ");
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
  const data = await api("/api/state?month=" + $("month").value);
  Object.assign(state, data);
  render();
}

function raw(value) { return { raw: value }; }
function cell(value) { return value && value.raw ? value.raw : esc(value); }
function table(headers, rows) {
  if (!rows.length) return '<p class="status">No records yet.</p>';
  return '<div class="tablewrap"><table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join("") + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + cell(c) + '</td>').join("") + '</tr>').join("") + '</tbody></table></div>';
}
function showToast(message) {
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 1800);
}
function pillFor(status) {
  return '<span class="pill ' + (status === "void" ? "bad" : status === "open" ? "warn" : "") + '">' + esc(status) + '</span>';
}
function formData(form) { return Object.fromEntries(new FormData(form).entries()); }

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

// --- Purchase invoice ------------------------------------------------------
let piLines = [];
function piNet(l) { return Math.max(0, Number(l.gross_weight_kg) - Number(l.units) * Number(l.stem_reduction_per_unit)); }
function piAmount(l) { return piNet(l) * Number(l.rate); }
function renderPiLines() {
  $("piLines").innerHTML = table(["Banana","Grade","Units","Gross kg","Stem/unit","Net kg","Rate","Vehicle","Amount","Action"], piLines.map((l, i) => [
    l.banana_type, l.grade, l.units, kg(l.gross_weight_kg), l.stem_reduction_per_unit, kg(piNet(l)), rs(l.rate), l.vehicle_no,
    rs(piAmount(l)), raw('<button type="button" class="secondary small" data-remove-pi-line="' + i + '">Remove</button>')
  ]));
  $("piTotal").textContent = "Running total: " + rs(piLines.reduce((a, l) => a + piAmount(l), 0));
}
function piFindRate() {
  const r = state.rates.find(x => x.banana_type === $("piBanana").value && x.grade === $("piGrade").value && x.rate_date === $("purchaseHeaderForm").invoice_date.value);
  if (r) $("piRate").value = r.buy_rate;
}
function siFindRate() {
  const r = state.rates.find(x => x.banana_type === $("siBanana").value && x.grade === $("siGrade").value && x.rate_date === $("saleHeaderForm").invoice_date.value);
  if (r) $("siRate").value = r.sell_rate;
}
$("piBanana").addEventListener("change", piFindRate);
$("piGrade").addEventListener("change", piFindRate);
$("purchaseHeaderForm").invoice_date.addEventListener("change", piFindRate);
$("siBanana").addEventListener("change", siFindRate);
$("siGrade").addEventListener("change", siFindRate);
$("saleHeaderForm").invoice_date.addEventListener("change", siFindRate);
$("piAddLine").onclick = () => {
  const line = { banana_type: $("piBanana").value, grade: $("piGrade").value, units: Number($("piUnits").value || 0), gross_weight_kg: Number($("piGross").value), stem_reduction_per_unit: Number($("piStem").value || 0), rate: Number($("piRate").value), vehicle_no: $("piVehicle").value, notes: $("piLineNotes").value };
  if (!line.gross_weight_kg || !line.rate) { showToast("Enter gross weight and rate"); return; }
  piLines.push(line);
  $("piUnits").value = ""; $("piGross").value = ""; $("piStem").value = ""; $("piRate").value = ""; $("piLineNotes").value = "";
  renderPiLines();
};
$("piLines").onclick = e => { if (e.target.dataset.removePiLine !== undefined) { piLines.splice(Number(e.target.dataset.removePiLine), 1); renderPiLines(); } };
$("piSave").onclick = () => guarded(async () => {
  if (!piLines.length) { showToast("Add at least one line item"); return; }
  const header = formData($("purchaseHeaderForm"));
  const out = await api("/api/purchase-invoices/create", Object.assign({}, header, { notes: $("piInvoiceNotes").value, items: piLines }));
  piLines = []; renderPiLines(); $("purchaseHeaderForm").reset(); $("purchaseHeaderForm").invoice_date.value = todayStr; $("piInvoiceNotes").value = "";
  window.open("/purchase-invoice/" + out.id, "_blank");
  showToast("Purchase invoice saved - sending...");
  const sendOut = await api("/api/purchase-invoices/send", { id: out.id });
  $("piStatus").textContent = "Invoice " + out.id + " saved. " + describeSend(sendOut);
  await load();
});

// --- Sales invoice -----------------------------------------------------
let siLines = [];
function siAmount(l) { return Number(l.net_weight_kg) * Number(l.rate); }
function renderSiLines() {
  $("siLines").innerHTML = table(["Banana","Grade","Net kg","Rate","Amount","Action"], siLines.map((l, i) => [
    l.banana_type, l.grade,
    raw('<input type="number" min="0" step="0.01" style="width:100px" data-si-kg="' + i + '" value="' + l.net_weight_kg + '">'),
    raw('<input type="number" min="0" step="0.01" style="width:100px" data-si-rate="' + i + '" value="' + l.rate + '">'),
    raw('<span data-si-amount="' + i + '">' + rs(siAmount(l)) + '</span>'), raw('<button type="button" class="secondary small" data-remove-si-line="' + i + '">Remove</button>')
  ]));
  $("siTotal").textContent = "Running total: " + rs(siLines.reduce((a, l) => a + siAmount(l), 0));
}
$("siLines").oninput = e => {
  const idx = e.target.dataset.siKg !== undefined ? e.target.dataset.siKg : e.target.dataset.siRate;
  if (idx === undefined) return;
  if (e.target.dataset.siKg !== undefined) siLines[Number(idx)].net_weight_kg = Number(e.target.value || 0);
  if (e.target.dataset.siRate !== undefined) siLines[Number(idx)].rate = Number(e.target.value || 0);
  const amountEl = document.querySelector('[data-si-amount="' + idx + '"]');
  if (amountEl) amountEl.textContent = rs(siAmount(siLines[Number(idx)]));
  $("siTotal").textContent = "Running total: " + rs(siLines.reduce((a, l) => a + siAmount(l), 0));
};
$("siLines").onclick = e => { if (e.target.dataset.removeSiLine !== undefined) { siLines.splice(Number(e.target.dataset.removeSiLine), 1); renderSiLines(); } };
$("siLoadVehicle").onclick = () => guarded(async () => {
  const vehicleNo = $("saleHeaderForm").vehicle_no.value;
  const date = $("saleHeaderForm").invoice_date.value;
  if (!vehicleNo || !date) { showToast("Pick a vehicle and date first"); return; }
  const existing = state.saleInvoices.filter(x => x.vehicle_no === vehicleNo && x.invoice_date === date && x.status !== "void");
  $("siExistingNotice").innerHTML = existing.length
    ? '<div class="notice">Note: ' + existing.length + ' invoice(s) already exist for this vehicle on ' + date + ' (' + existing.map(x => x.invoice_no + " - " + rs(x.total)).join(", ") + '). You can still create another - the lines below already account for what was previously sold.</div>'
    : "";
  const rows = await api("/api/sale-invoices/vehicle-load?vehicle_no=" + encodeURIComponent(vehicleNo) + "&date=" + date);
  if (!rows.length) { showToast("No purchases found for this vehicle/date - add lines manually below"); return; }
  siLines = rows.filter(r => r.available_kg > 0).map(r => {
    const rate = state.rates.find(x => x.banana_type === r.banana_type && x.grade === r.grade && x.rate_date === date);
    return { banana_type: r.banana_type, grade: r.grade, net_weight_kg: r.available_kg, rate: rate ? rate.sell_rate : 0, notes: "" };
  });
  renderSiLines();
  showToast("Loaded " + siLines.length + " line(s) from purchases - review before saving");
});
$("siAddLine").onclick = () => {
  const line = { banana_type: $("siBanana").value, grade: $("siGrade").value, net_weight_kg: Number($("siKg").value), rate: Number($("siRate").value), notes: $("siLineNotes").value };
  if (!line.net_weight_kg || !line.rate) { showToast("Enter kg and rate"); return; }
  siLines.push(line);
  $("siKg").value = ""; $("siRate").value = ""; $("siLineNotes").value = "";
  renderSiLines();
};
$("siSave").onclick = () => guarded(async () => {
  if (!siLines.length) { showToast("Add at least one line item"); return; }
  const header = formData($("saleHeaderForm"));
  const out = await api("/api/sale-invoices/create", Object.assign({}, header, { notes: $("siInvoiceNotes").value, items: siLines }));
  siLines = []; renderSiLines(); $("saleHeaderForm").reset(); $("saleHeaderForm").invoice_date.value = todayStr; $("siInvoiceNotes").value = "";
  window.open("/sale-invoice/" + out.id, "_blank");
  showToast("Sales invoice saved - sending...");
  const sendOut = await api("/api/sale-invoices/send", { id: out.id });
  $("siStatus").textContent = "Invoice " + out.id + " saved. " + describeSend(sendOut);
  await load();
});

// --- Invoices list -------------------------------------------------------
function updatePaidModal(kind, invoice) {
  openModal("Update paid - " + invoice.invoice_no, '<form id="mForm" class="sectiongap">' + fld("Paid amount", '<input name="paid" type="number" min="0" step="0.01" value="' + invoice.paid + '" required>') + '<button>Save</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/" + (kind === "purchase" ? "purchase-invoices" : "sale-invoices") + "/paid", Object.assign({ id: invoice.id }, formData(e.target))); closeModal(); showToast("Updated"); await load(); }); };
}
async function viewInvoiceModal(kind, id) {
  const base = kind === "purchase" ? "purchase-invoices" : "sale-invoices";
  const data = await api("/api/" + base + "/detail?id=" + id);
  const inv = data.invoice;
  const printPath = (kind === "purchase" ? "/purchase-invoice/" : "/sale-invoice/") + id;
  let body = '<p class="subcopy">' + (kind === "purchase" ? esc(inv.farmer_name) : esc(inv.vendor_name) + " | " + esc(inv.vehicle_no)) + ' | ' + esc(inv.invoice_date) + ' | ' + pillFor(inv.status) + '</p>';
  body += kind === "purchase"
    ? table(["Banana (grade)", "Units", "Gross kg", "Stem/unit", "Net kg", "Rate", "Vehicle", "Amount"], data.items.map(it => [it.banana_type + " (" + it.grade + ")", it.units, kg(it.gross_weight_kg), it.stem_reduction_per_unit, kg(it.net_weight_kg), rs(it.rate), it.vehicle_no, rs(it.amount)]))
    : table(["Banana (grade)", "Net kg", "Rate", "Amount"], data.items.map(it => [it.banana_type + " (" + it.grade + ")", kg(it.net_weight_kg), rs(it.rate), rs(it.amount)]));
  body += '<p class="subcopy" style="margin-top:10px">Total ' + rs(inv.total) + ' | Paid ' + rs(inv.paid) + ' | Pending ' + rs(inv.pending) + '</p>';
  body += '<div class="actions" style="margin-top:10px"><a class="btn secondary small" href="' + printPath + '" target="_blank">Open print view</a></div>';
  openModal(inv.invoice_no, body);
}
function invoiceActions(kind, x) {
  const printPath = kind === "purchase" ? "/purchase-invoice/" : "/sale-invoice/";
  let html = '<div class="actions"><button type="button" class="secondary small" data-view-invoice="' + kind + ":" + x.id + '">View</button>';
  html += ' <a class="btn secondary small" href="' + printPath + x.id + '" target="_blank">Print</a>';
  html += ' <button type="button" class="secondary small" data-update-paid="' + kind + ":" + x.id + '">Paid</button>';
  html += ' <button type="button" class="secondary small" data-resend="' + kind + ":" + x.id + '">Resend</button>';
  if (state.me && state.me.role === "owner" && x.status !== "void") html += ' <button type="button" class="danger small" data-void="' + kind + ":" + x.id + '">Void</button>';
  return html + '</div>';
}
function wireInvoiceTable(tableId, kind, list) {
  $(tableId).onclick = e => {
    const t = e.target.dataset;
    if (t.viewInvoice) { const [, id] = t.viewInvoice.split(":"); guarded(() => viewInvoiceModal(kind, Number(id))); }
    if (t.updatePaid) { const [, id] = t.updatePaid.split(":"); updatePaidModal(kind, list.find(x => x.id === Number(id))); }
    if (t.resend) { const [, id] = t.resend.split(":"); guarded(async () => { const out = await api("/api/" + (kind === "purchase" ? "purchase-invoices" : "sale-invoices") + "/send", { id: Number(id) }); alert(describeSend(out)); }); }
    if (t.void && confirm("Void this invoice?")) { const [, id] = t.void.split(":"); guarded(async () => { await api("/api/" + (kind === "purchase" ? "purchase-invoices" : "sale-invoices") + "/void", { id: Number(id) }); showToast("Voided"); await load(); }); }
  };
}

// --- Masters ---------------------------------------------------------------
function editFarmer(row) {
  openModal("Edit farmer", '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Name", '<input name="name" value="' + esc(row.name) + '" required>') +
    fld("Phone", '<input name="phone" value="' + esc(row.phone) + '">') +
    fld("Email", '<input name="email" type="email" value="' + esc(row.email) + '">') +
    fld("Village", '<input name="village" value="' + esc(row.village) + '">') +
    fld("GST / tax id", '<input name="gst" value="' + esc(row.gst) + '">') +
    '</div>' + fld("Address", '<textarea name="address">' + esc(row.address) + '</textarea>') + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/farmers/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Farmer updated"); await load(); }); };
}
function editVendor(row) {
  openModal("Edit buyer", '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Name", '<input name="name" value="' + esc(row.name) + '" required>') +
    fld("Phone", '<input name="phone" value="' + esc(row.phone) + '">') +
    fld("Email", '<input name="email" type="email" value="' + esc(row.email) + '">') +
    fld("Market", '<input name="market" value="' + esc(row.market) + '">') +
    fld("GST / tax id", '<input name="gst" value="' + esc(row.gst) + '">') +
    '</div>' + fld("Address", '<textarea name="address">' + esc(row.address) + '</textarea>') + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/vendors/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Buyer updated"); await load(); }); };
}

function render() {
  document.querySelector("#purchaseHeaderForm").farmer_id.innerHTML = farmerOptions();
  document.querySelector("#saleHeaderForm").vendor_id.innerHTML = vendorOptions();
  document.querySelector("#saleHeaderForm").vehicle_no.innerHTML = vehicleOptions();
  ["piBanana", "siBanana"].forEach(id => refreshSelectPreservingValue(id, bananaOptionsWith));
  ["piGrade", "siGrade"].forEach(id => refreshSelectPreservingValue(id, gradeOptionsWith));
  $("piVehicle").innerHTML = vehicleOptions();
  $("rateForm").banana_type.innerHTML = bananaOptions();
  $("rateForm").grade.innerHTML = gradeOptions();
  piFindRate();
  siFindRate();

  const pInvoices = state.purchaseInvoices.filter(x => x.status !== "void");
  const sInvoices = state.saleInvoices.filter(x => x.status !== "void");
  const purchaseValue = pInvoices.reduce((a, x) => a + x.total, 0);
  const saleValue = sInvoices.reduce((a, x) => a + x.total, 0);
  $("mPurchase").textContent = rs(purchaseValue);
  $("mSales").textContent = rs(saleValue);
  $("mMargin").textContent = rs(saleValue - purchaseValue);
  $("mCollect").textContent = rs(sInvoices.reduce((a, x) => a + x.pending, 0));
  $("mPayable").textContent = rs(pInvoices.reduce((a, x) => a + x.pending, 0));

  $("farmersTable").innerHTML = table(["Name", "Phone", "Email", "Village", "Pending payable", "Actions"], state.farmers.map(x => [
    x.name, x.phone, x.email, x.village,
    raw('<span class="' + (x.pending > 0 ? "balance-due" : "balance-clear") + '">' + rs(x.pending) + '</span>'),
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-farmer="' + x.id + '">Edit</button> <button type="button" class="danger small" data-del-farmer="' + x.id + '">Delete</button></div>')
  ]));
  $("vendorsTable").innerHTML = table(["Name", "Phone", "Email", "Market", "Pending collection", "Actions"], state.vendors.map(x => [
    x.name, x.phone, x.email, x.market,
    raw('<span class="' + (x.pending > 0 ? "balance-due" : "balance-clear") + '">' + rs(x.pending) + '</span>'),
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-vendor="' + x.id + '">Edit</button> <button type="button" class="danger small" data-del-vendor="' + x.id + '">Delete</button></div>')
  ]));
  $("vehiclesTable").innerHTML = table(["Vehicle", "Driver", "Phone", "Action"], state.vehicles.map(x => [x.vehicle_no, x.driver_name, x.phone, raw('<button type="button" class="danger small" data-del-vehicle="' + x.id + '">Remove</button>')]));
  $("bananaTypesTable").innerHTML = table(["Banana type", "Action"], state.bananaTypes.map(x => [x.name, raw('<button type="button" class="danger small" data-del-banana="' + x.id + '">Remove</button>')]));

  $("purchaseInvoiceTable").innerHTML = table(["No", "Farmer", "Date", "Total", "Paid", "Pending", "Status", "Actions"], state.purchaseInvoices.map(x => [x.invoice_no, x.farmer_name, x.invoice_date, rs(x.total), rs(x.paid), rs(x.pending), raw(pillFor(x.status)), raw(invoiceActions("purchase", x))]));
  wireInvoiceTable("purchaseInvoiceTable", "purchase", state.purchaseInvoices);
  $("saleInvoiceTable").innerHTML = table(["No", "Buyer", "Vehicle", "Date", "Total", "Paid", "Pending", "Status", "Actions"], state.saleInvoices.map(x => [x.invoice_no, x.vendor_name, x.vehicle_no, x.invoice_date, rs(x.total), rs(x.paid), rs(x.pending), raw(pillFor(x.status)), raw(invoiceActions("sale", x))]));
  wireInvoiceTable("saleInvoiceTable", "sale", state.saleInvoices);

  $("rateCards").innerHTML = table(["Banana type", "Grade", "Buy rate", "Sell rate"], state.bananaTypes.flatMap(b => GRADES.map(g => {
    const r = state.rates.find(x => x.rate_date === todayStr && x.banana_type === b.name && x.grade === g);
    return [b.name, g, r ? rs(r.buy_rate) : "—", r ? rs(r.sell_rate) : "—"];
  })));

  document.querySelector('input[name="daily_email_recipients"]').value = state.settings.daily_email_recipients || "";
  document.querySelector('input[name="weekly_email_recipients"]').value = state.settings.weekly_email_recipients || "";
  document.querySelector('input[name="monthly_email_recipients"]').value = state.settings.monthly_email_recipients || "";
  document.querySelector('input[name="whatsapp_numbers"]').value = state.settings.whatsapp_numbers || "";
  ["business_name", "business_address", "proprietor1_name", "proprietor1_phone", "proprietor2_name", "proprietor2_phone"].forEach(k => {
    const el = document.querySelector('input[name="' + k + '"]');
    if (el) el.value = state.settings[k] || "";
  });
  const isOwner = state.me && state.me.role === "owner";
  $("reportSettingsForm").style.display = isOwner ? "grid" : "none";
  $("emailLogs").innerHTML = table(["Date", "Recipients", "Status", "Message"], state.emailLogs.slice(0, 10).map(x => [x.report_date, x.recipients, x.status, x.provider_message]));

  if (isOwner) {
    $("staffTable").innerHTML = table(["Email", "Name", "Role", "Status", "Action"], state.staff.map(x => [x.email, x.name, raw('<span class="pill">' + esc(x.role) + '</span>'), raw('<span class="pill ' + (x.active ? "" : "bad") + '">' + (x.active ? "active" : "inactive") + '</span>'), raw('<button type="button" class="secondary small" data-toggle-staff="' + x.id + '" data-active="' + x.active + '">' + (x.active ? "Deactivate" : "Activate") + '</button>')]));
    $("activityTable").innerHTML = table(["When", "Entity", "Action", "By", "Details"], state.auditLogs.map(x => [x.created_at, x.entity_type + " #" + x.entity_id, x.action, x.changed_by, raw('<button type="button" class="secondary small" data-view-audit="' + x.id + '">View</button>')]));
  }
}

$("farmerForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/farmers", formData(e.target)); e.target.reset(); showToast("Farmer saved"); await load(); }); };
$("vendorForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/vendors", formData(e.target)); e.target.reset(); showToast("Buyer saved"); await load(); }); };
$("vehicleForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/vehicles", formData(e.target)); e.target.reset(); showToast("Vehicle saved"); await load(); }); };
$("bananaTypeForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/banana-types", formData(e.target)); e.target.reset(); showToast("Banana type saved"); await load(); }); };

function csvParse(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i], n = text[i + 1]; if (c === '"' && q && n === '"') { cell += '"'; i++; } else if (c === '"') { q = !q; } else if (c === "," && !q) { row.push(cell); cell = ""; } else if ((c === "\\n" || c === "\\r") && !q) { if (c === "\\r" && n === "\\n") i++; row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ""; } else cell += c; }
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  const head = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])));
}
document.querySelectorAll("[data-import-type]").forEach(input => {
  input.onchange = () => guarded(async () => {
    const file = input.files[0];
    if (!file) return;
    const rows = csvParse(await file.text());
    const out = await api("/api/masters/import", { type: input.dataset.importType, rows });
    showToast("Imported " + out.count + " row(s)");
    input.value = "";
    await load();
  });
});
$("rateForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/rates", Object.assign(formData(e.target), { rate_date: todayStr })); e.target.reset(); showToast("Rate saved"); await load(); }); };
$("staffForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/staff", formData(e.target)); e.target.reset(); showToast("Staff saved"); await load(); }); };
$("reportSettingsForm").onsubmit = e => { e.preventDefault(); guarded(async () => { await api("/api/settings", formData(e.target)); showToast("Settings saved"); await load(); }); };

$("farmersTable").onclick = e => {
  const t = e.target.dataset;
  if (t.editFarmer) editFarmer(state.farmers.find(x => x.id === Number(t.editFarmer)));
  if (t.delFarmer && confirm("Delete this farmer? Past invoices stay on record.")) guarded(async () => { await api("/api/farmers/delete", { id: Number(t.delFarmer) }); showToast("Farmer deleted"); await load(); });
};
$("vendorsTable").onclick = e => {
  const t = e.target.dataset;
  if (t.editVendor) editVendor(state.vendors.find(x => x.id === Number(t.editVendor)));
  if (t.delVendor && confirm("Delete this buyer? Past invoices stay on record.")) guarded(async () => { await api("/api/vendors/delete", { id: Number(t.delVendor) }); showToast("Buyer deleted"); await load(); });
};
$("vehiclesTable").onclick = e => {
  if (e.target.dataset.delVehicle && confirm("Remove this vehicle?")) guarded(async () => { await api("/api/vehicles/delete", { id: Number(e.target.dataset.delVehicle) }); showToast("Vehicle removed"); await load(); });
};
$("bananaTypesTable").onclick = e => {
  if (e.target.dataset.delBanana && confirm("Remove this banana type?")) guarded(async () => { await api("/api/banana-types/delete", { id: Number(e.target.dataset.delBanana) }); showToast("Removed"); await load(); });
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

// --- Reports ---------------------------------------------------------------
$("reportForm").period.onchange = e => {
  const f = $("reportForm");
  if (e.target.value === "Daily") { f.from.value = todayStr; f.to.value = todayStr; }
  if (e.target.value === "Weekly") { const d = new Date(todayStr); d.setDate(d.getDate() - 6); f.from.value = d.toISOString().slice(0, 10); f.to.value = todayStr; }
  if (e.target.value === "Monthly") { f.from.value = todayStr.slice(0, 8) + "01"; f.to.value = todayStr; }
};
$("reportForm").from.value = todayStr; $("reportForm").to.value = todayStr;
$("reportGenerate").onclick = () => guarded(async () => {
  const f = formData($("reportForm"));
  const out = await api("/api/reports/period?from=" + f.from + "&to=" + f.to);
  const totalBuy = out.rows.reduce((a, r) => a + r.buy_value, 0);
  const totalSell = out.rows.reduce((a, r) => a + r.sell_value, 0);
  $("reportSummary").textContent = "Buy " + rs(totalBuy) + " | Sell " + rs(totalSell) + " | Margin " + rs(totalSell - totalBuy);
  $("reportTable").innerHTML = table(["Banana", "Grade", "Buy kg", "Buy value", "Sell kg", "Sell value", "Margin"], out.rows.map(r => [r.banana_type, r.grade, kg(r.buy_kg), rs(r.buy_value), kg(r.sell_kg), rs(r.sell_value), rs(r.margin)]));
});
$("reportSend").onclick = () => guarded(async () => {
  const f = formData($("reportForm"));
  const out = await api("/api/reports/send", f);
  alert("Report status: " + out.status + (out.message ? " - " + out.message : ""));
  await load();
});

$("refresh").onclick = load; $("month").onchange = load;
$("loginForm").onsubmit = e => {
  e.preventDefault();
  guarded(async () => {
    const input = formData(e.target);
    pendingEmail = input.email.trim().toLowerCase();
    const out = await api("/api/auth/request", { email: pendingEmail });
    $("otpForm").style.display = "grid";
    $("loginOtp").focus();
    $("authStatus").textContent = out.dev_otp ? "OTP for testing: " + out.dev_otp : "OTP sent to " + pendingEmail + ".";
  });
};
$("otpForm").onsubmit = e => {
  e.preventDefault();
  guarded(async () => {
    const out = await api("/api/auth/verify", { email: pendingEmail, otp: formData(e.target).otp });
    setUser(out.user);
    showToast("Logged in");
    await load();
  });
};
$("logout").onclick = async () => { await api("/api/auth/logout", {}); location.reload(); };

$("purchaseHeaderForm").invoice_date.value = todayStr;
$("saleHeaderForm").invoice_date.value = todayStr;
renderPiLines();
renderSiLines();
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
      <div class="sidefoot">Private workspace. Data is stored in the hosted database.</div>
    </aside>
    <main class="shell">
      <section class="topbar">
        <div class="titleblock">
          <p class="eyebrow">Live operations</p>
          <h1>KMS Banana control desk</h1>
          <p class="copy">Purchase invoices from farmers, sales invoices to buyers, and reports — all in one place.</p>
        </div>
        <div class="datebox">
          <div class="datefield">
            <label for="month">Month</label>
            <input id="month" type="month">
          </div>
          <button id="refresh">Refresh</button>
        </div>
      </section>

    <section class="metrics">
      <article class="metric"><span>Purchase value</span><strong id="mPurchase">Rs 0</strong></article>
      <article class="metric"><span>Sales value</span><strong id="mSales">Rs 0</strong></article>
      <article class="metric"><span>Margin</span><strong id="mMargin">Rs 0</strong></article>
      <article class="metric"><span>Pending collection</span><strong id="mCollect">Rs 0</strong></article>
      <article class="metric"><span>Pending payable</span><strong id="mPayable">Rs 0</strong></article>
    </section>

    <section id="purchase" class="view active">
      <div class="grid">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Purchase invoice</p><h2>Buy from farmer</h2><p class="subcopy">Pick the farmer, add a line per banana type + grade (each can have its own stem reduction, units, and vehicle), verify the totals below, then save. The invoice prints, emails, and WhatsApps to the farmer automatically.</p></div></div>
          <form class="formgrid" id="purchaseHeaderForm">
            <select name="farmer_id" required></select>
            <input name="invoice_date" type="date" required>
            <input name="paid" type="number" min="0" step="0.01" placeholder="Amount paid now">
          </form>
          <div class="formgrid" style="margin-top:10px">
            <select id="piBanana"></select>
            <select id="piGrade"></select>
            <select id="piVehicle"></select>
            <input id="piUnits" type="number" min="0" step="1" placeholder="Units">
            <input id="piGross" type="number" min="0" step="0.01" placeholder="Gross weight kg">
            <input id="piStem" type="number" min="0" step="0.01" placeholder="Stem reduction / unit">
            <input id="piRate" type="number" min="0" step="0.01" placeholder="Rate / kg">
            <input id="piLineNotes" placeholder="Line notes">
            <button type="button" id="piAddLine">Add line</button>
          </div>
          <div id="piLines"></div>
          <p class="subcopy" id="piTotal">Running total: Rs 0</p>
          <textarea id="piInvoiceNotes" placeholder="Invoice notes"></textarea>
          <div class="actions" style="margin-top:10px"><button type="button" id="piSave">Verify &amp; save invoice</button></div>
          <p class="status" id="piStatus"></p>
        </div>
      </div>
    </section>

    <section id="sale" class="view">
      <div class="grid">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Sales invoice</p><h2>Sell to buyer</h2><p class="subcopy">Pick the vehicle and date, then load its purchased banana types/grades automatically. Every field is editable before saving. The invoice prints, emails, and WhatsApps to the buyer automatically.</p></div></div>
          <form class="formgrid" id="saleHeaderForm">
            <select name="vendor_id" required></select>
            <select name="vehicle_no" required></select>
            <input name="invoice_date" type="date" required>
            <input name="paid" type="number" min="0" step="0.01" placeholder="Amount paid now">
            <button type="button" id="siLoadVehicle">Load vehicle's purchases</button>
          </form>
          <div id="siExistingNotice"></div>
          <div class="formgrid" style="margin-top:10px">
            <select id="siBanana"></select>
            <select id="siGrade"></select>
            <input id="siKg" type="number" min="0" step="0.01" placeholder="Net weight kg">
            <input id="siRate" type="number" min="0" step="0.01" placeholder="Rate / kg">
            <input id="siLineNotes" placeholder="Line notes">
            <button type="button" id="siAddLine">Add line manually</button>
          </div>
          <div id="siLines"></div>
          <p class="subcopy" id="siTotal">Running total: Rs 0</p>
          <textarea id="siInvoiceNotes" placeholder="Invoice notes"></textarea>
          <div class="actions" style="margin-top:10px"><button type="button" id="siSave">Verify &amp; save invoice</button></div>
          <p class="status" id="siStatus"></p>
        </div>
      </div>
    </section>

    <section id="invoices" class="view">
      <div class="subtabs" data-subtabs="invoices">
        <button type="button" class="active" data-subview="invoicesPurchase">Purchase invoices</button>
        <button type="button" data-subview="invoicesSale">Sales invoices</button>
      </div>
      <div id="invoicesPurchase" class="subview active">
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Purchase invoices</p><h2>Farmer invoices this month</h2></div></div><div id="purchaseInvoiceTable"></div></div>
      </div>
      <div id="invoicesSale" class="subview">
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Sales invoices</p><h2>Buyer invoices this month</h2></div></div><div id="saleInvoiceTable"></div></div>
      </div>
    </section>

    <section id="masters" class="view">
      <div class="subtabs" data-subtabs="masters">
        <button type="button" class="active" data-subview="mastersFarmers">Farmers</button>
        <button type="button" data-subview="mastersVendors">Buyers</button>
        <button type="button" data-subview="mastersVehicles">Vehicles</button>
        <button type="button" data-subview="mastersBananas">Banana types</button>
      </div>
      <div id="mastersFarmers" class="subview active">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Farmers</h2></div>
            <div class="actions"><a class="btn secondary small" href="/api/masters/template?type=farmers">Template</a> <a class="btn secondary small" href="/api/masters/export?type=farmers">Export</a> <label class="btn secondary small" style="cursor:pointer">Import CSV<input type="file" accept=".csv,text/csv" data-import-type="farmers" style="display:none"></label></div>
          </div>
          <form class="formgrid two" id="farmerForm">
            <input name="name" placeholder="Farmer name" required><input name="phone" placeholder="Phone">
            <input name="email" type="email" placeholder="Email"><input name="village" placeholder="Village">
            <input name="gst" placeholder="GST / tax id"><textarea name="address" placeholder="Address"></textarea>
            <textarea name="notes" placeholder="Notes"></textarea>
            <button>Save farmer</button>
          </form>
          <div id="farmersTable"></div>
        </div>
      </div>
      <div id="mastersVendors" class="subview">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Buyers</h2></div>
            <div class="actions"><a class="btn secondary small" href="/api/masters/template?type=vendors">Template</a> <a class="btn secondary small" href="/api/masters/export?type=vendors">Export</a> <label class="btn secondary small" style="cursor:pointer">Import CSV<input type="file" accept=".csv,text/csv" data-import-type="vendors" style="display:none"></label></div>
          </div>
          <form class="formgrid two" id="vendorForm">
            <input name="name" placeholder="Buyer name" required><input name="phone" placeholder="Phone">
            <input name="email" type="email" placeholder="Email"><input name="market" placeholder="Market">
            <input name="gst" placeholder="GST / tax id"><textarea name="address" placeholder="Address"></textarea>
            <textarea name="notes" placeholder="Notes"></textarea>
            <button>Save buyer</button>
          </form>
          <div id="vendorsTable"></div>
        </div>
      </div>
      <div id="mastersVehicles" class="subview">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Vehicles</h2></div>
            <div class="actions"><a class="btn secondary small" href="/api/masters/template?type=vehicles">Template</a> <a class="btn secondary small" href="/api/masters/export?type=vehicles">Export</a> <label class="btn secondary small" style="cursor:pointer">Import CSV<input type="file" accept=".csv,text/csv" data-import-type="vehicles" style="display:none"></label></div>
          </div>
          <form class="formgrid two" id="vehicleForm">
            <input name="vehicle_no" placeholder="Vehicle number" required>
            <input name="driver_name" placeholder="Driver name">
            <input name="phone" placeholder="Phone">
            <button>Save vehicle</button>
          </form>
          <div id="vehiclesTable"></div>
        </div>
      </div>
      <div id="mastersBananas" class="subview">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Master list</p><h2>Banana types</h2></div>
            <div class="actions"><a class="btn secondary small" href="/api/masters/template?type=banana-types">Template</a> <a class="btn secondary small" href="/api/masters/export?type=banana-types">Export</a> <label class="btn secondary small" style="cursor:pointer">Import CSV<input type="file" accept=".csv,text/csv" data-import-type="banana-types" style="display:none"></label></div>
          </div>
          <form class="formgrid two" id="bananaTypeForm">
            <input name="name" placeholder="Banana type name" required>
            <button>Save banana type</button>
          </form>
          <div id="bananaTypesTable"></div>
        </div>
      </div>
    </section>

    <section id="rates" class="view">
      <div class="grid">
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Today's rates</p><h2>Rate board by grade</h2><p class="subcopy">Used to auto-suggest prices on invoices.</p></div></div>
          <div id="rateCards"></div>
          <form class="formgrid five" id="rateForm">
            <select name="banana_type"></select>
            <select name="grade"></select>
            <input name="buy_rate" type="number" min="0" step="0.01" placeholder="Buy rate / kg" required>
            <input name="sell_rate" type="number" min="0" step="0.01" placeholder="Sell rate / kg" required>
            <button>Save rate</button>
          </form>
        </div>
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Reports</p><h2>Day / week / month report</h2><p class="subcopy">Buy vs sell value and margin by banana type and grade. Sends automatically on schedule (daily, plus weekly every Monday and monthly on the 1st) to the recipients below, or send on demand now.</p></div></div>
          <form class="formgrid" id="reportForm">
            <select name="period"><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option></select>
            <input name="from" type="date" required><input name="to" type="date" required>
            <button type="button" id="reportGenerate">Preview</button>
            <button type="button" id="reportSend">Send now</button>
          </form>
          <p class="subcopy" id="reportSummary"></p>
          <div id="reportTable"></div>
        </div>
        <div class="panel wide">
          <div class="heading"><div><p class="eyebrow">Auto-send</p><h2>Report recipients</h2><p class="subcopy">Comma-separate multiple emails or WhatsApp numbers (with country code).</p></div></div>
          <form class="formgrid two" id="reportSettingsForm">
            <input name="daily_email_recipients" placeholder="Daily report emails">
            <input name="weekly_email_recipients" placeholder="Weekly report emails">
            <input name="monthly_email_recipients" placeholder="Monthly report emails">
            <input name="whatsapp_numbers" placeholder="WhatsApp numbers">
            <p class="subcopy" style="grid-column:1/-1;margin-top:6px">Business details printed on every invoice. Leave a field blank to keep its default.</p>
            <input name="business_name" placeholder="Business name (default: KMS Banana)">
            <input name="business_address" placeholder="Business address">
            <input name="proprietor1_name" placeholder="Proprietor 1 name">
            <input name="proprietor1_phone" placeholder="Proprietor 1 phone(s)">
            <input name="proprietor2_name" placeholder="Proprietor 2 name">
            <input name="proprietor2_phone" placeholder="Proprietor 2 phone(s)">
            <button>Save settings</button>
          </form>
          <div id="emailLogs"></div>
        </div>
      </div>
    </section>

    <section id="staff" class="view">
      <div class="grid">
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Access control</p><h2>Add staff</h2><p class="subcopy">Only emails added here can log in. Owner has full access; staff can run daily operations.</p></div></div>
          <form class="formgrid two" id="staffForm">
            <input name="email" type="email" placeholder="Email address" required>
            <input name="name" placeholder="Name">
            <select name="role"><option value="staff">Staff</option><option value="owner">Owner</option></select>
            <button>Save staff</button>
          </form>
        </div>
        <div class="panel"><div class="heading"><div><p class="eyebrow">Team</p><h2>Staff accounts</h2></div></div><div id="staffTable"></div></div>
      </div>
    </section>

    <section id="activity" class="view">
      <div class="grid">
        <div class="panel wide"><div class="heading"><div><p class="eyebrow">Audit trail</p><h2>Recent changes</h2></div></div><div id="activityTable"></div></div>
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
