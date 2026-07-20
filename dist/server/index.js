//#region worker/email.ts
async function sendEmail(env, to, subject, text) {
	if (!env.SENDGRID_API_KEY || !env.EMAIL_FROM) return {
		sent: false,
		message: "Email provider is not configured."
	};
	const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.SENDGRID_API_KEY}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({
			personalizations: [{ to: to.map((email) => ({ email })) }],
			from: { email: env.EMAIL_FROM },
			subject,
			content: [{
				type: "text/plain",
				value: text
			}]
		})
	});
	const message = response.status === 202 ? "Sent" : await response.text();
	return {
		sent: response.status === 202,
		message
	};
}
//#endregion
//#region worker/util.ts
var BANANAS = [
	"Nendran",
	"Robusta",
	"Poovan",
	"Red Banana"
];
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
	return new Response(body, { headers: {
		"content-type": "text/csv; charset=utf-8",
		"content-disposition": `attachment; filename="${filename}"`
	} });
}
function e(value) {
	return String(value ?? "").replace(/[&<>"']/g, (char) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[char]);
}
function csvCell(value) {
	const text = String(value ?? "");
	return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}
function toCsv(headers, rows) {
	return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
}
async function all(db, sql, ...binds) {
	return (await db.prepare(sql).bind(...binds).all()).results || [];
}
async function bodyJson(request) {
	try {
		return await request.json();
	} catch {
		return {};
	}
}
function cookieValue(request, name) {
	return (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
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
	return new Date(Date.now() + minutes * 60 * 1e3).toISOString();
}
function currentMonth() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
}
function today() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
	return btoa(binary);
}
function money(value) {
	return `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}
//#endregion
//#region worker/auth.ts
function sessionCookie(token, maxAge = 3600 * 24 * 30) {
	return `kms_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function clearSessionCookie() {
	return "kms_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}
async function staffCount(db) {
	const row = await db.prepare("SELECT COUNT(*) AS count FROM staff_users").first();
	return Number(row?.count || 0);
}
async function findStaff(db, email) {
	return db.prepare("SELECT email, name, role, active FROM staff_users WHERE email = ?").bind(email).first();
}
async function currentUser(db, request) {
	const token = cookieValue(request, "kms_session");
	if (!token) return null;
	const tokenHash = await sha256(token);
	const session = await db.prepare("SELECT email, expires_at FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).first();
	if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
	const staff = await findStaff(db, session.email);
	if (!staff || !staff.active) return null;
	await db.prepare("UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?").bind(tokenHash).run();
	return {
		email: staff.email,
		name: staff.name || "",
		role: staff.role
	};
}
function requireRole(user, roles) {
	if (!roles.includes(user.role)) return json({ error: "You do not have permission for this action." }, 403);
	return null;
}
async function sendOtpEmail(env, email, code) {
	const subject = "KMS Banana login OTP";
	const text = `Your KMS Banana login OTP is ${code}. It expires in 10 minutes.`;
	return sendEmail(env, [email], subject, text);
}
async function requestOtp(db, env, input) {
	const email = String(input.email || "").trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
	const bootstrap = await staffCount(db) === 0;
	if (!bootstrap) {
		const staff = await findStaff(db, email);
		if (!staff || !staff.active) return json({ error: "This email is not authorized. Ask the owner to add you under Staff first." }, 403);
	}
	const code = randomDigits();
	await db.prepare("INSERT INTO auth_otps (email, code_hash, expires_at) VALUES (?, ?, ?)").bind(email, await sha256(`${email}:${code}`), isoAfter(10)).run();
	const delivery = await sendOtpEmail(env, email, code);
	return json({
		ok: true,
		delivery: delivery.sent ? "sent" : "draft",
		dev_otp: delivery.sent ? void 0 : code,
		bootstrap
	});
}
async function verifyOtp(db, input) {
	const email = String(input.email || "").trim().toLowerCase();
	const otpHash = await sha256(`${email}:${String(input.otp || "").trim()}`);
	const row = await db.prepare("SELECT id FROM auth_otps WHERE email = ? AND code_hash = ? AND used_at = '' AND expires_at > ? ORDER BY id DESC LIMIT 1").bind(email, otpHash, (/* @__PURE__ */ new Date()).toISOString()).first();
	if (!row) return json({ error: "Invalid or expired OTP." }, 401);
	await db.prepare("UPDATE auth_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
	if (await staffCount(db) === 0) await db.prepare("INSERT INTO staff_users (email, name, role, active) VALUES (?, ?, 'owner', 1)").bind(email, "").run();
	const staff = await findStaff(db, email);
	if (!staff || !staff.active) return json({ error: "This email is not authorized." }, 403);
	const token = randomToken();
	await db.prepare("INSERT INTO auth_sessions (email, token_hash, expires_at) VALUES (?, ?, ?)").bind(email, await sha256(token), isoAfter(1440 * 30)).run();
	return json({
		ok: true,
		user: {
			email: staff.email,
			name: staff.name || "",
			role: staff.role
		}
	}, 200, { "set-cookie": sessionCookie(token) });
}
async function logout(db, request) {
	const token = cookieValue(request, "kms_session");
	if (token) await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
	return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
async function listStaff(db) {
	return (await db.prepare("SELECT id, email, name, role, active, created_at FROM staff_users ORDER BY created_at").all()).results || [];
}
async function createStaff(db, input) {
	const email = String(input.email || "").trim().toLowerCase();
	const role = [
		"owner",
		"staff",
		"cutter"
	].includes(String(input.role)) ? String(input.role) : "staff";
	if (!email) throw new Error("Email is required");
	await db.prepare("INSERT INTO staff_users (email, name, role, active) VALUES (?, ?, ?, 1) ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, active = 1").bind(email, String(input.name || ""), role).run();
}
async function setStaffActive(db, id, active) {
	await db.prepare("UPDATE staff_users SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
}
//#endregion
//#region worker/views/shell.ts
var STYLE = `
:root{--bg:#f4f6f3;--ink:#17211b;--muted:#66736a;--panel:#fff;--panel2:#f9fbf7;--line:#dce3d8;--line2:#eef2eb;--brand:#2f6b43;--brand2:#184c2c;--accent:#c9972d;--blue:#315f90;--bad:#b3463c;--ok:#2f7d4c;--shadow:0 16px 40px rgba(23,33,27,.08)}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 92% 8%,rgba(217,173,58,.17),transparent 280px),var(--bg);color:var(--ink);font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px}button,input,select,textarea{font:inherit}button,.btn{align-items:center;background:var(--brand);border:1px solid transparent;border-radius:7px;color:#fff;cursor:pointer;display:inline-flex;font-weight:760;gap:7px;justify-content:center;min-height:38px;padding:9px 13px;text-decoration:none;transition:background .15s,border-color .15s,box-shadow .15s}button:hover,.btn:hover{background:var(--brand2);box-shadow:0 8px 18px rgba(47,107,67,.18)}button.secondary,.btn.secondary{background:#fff;border-color:var(--line);color:var(--ink)}button.secondary:hover,.btn.secondary:hover{background:#f1f5ee;box-shadow:none}button.danger{background:var(--bad);color:#fff}button.small{min-height:30px;padding:5px 9px;font-size:.8rem}input,select,textarea{background:#fff;border:1px solid var(--line);border-radius:7px;color:var(--ink);outline:none;padding:10px 11px;width:100%}input:focus,select:focus,textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(47,107,67,.12)}textarea{min-height:90px;resize:vertical}h1,h2,h3,p{margin:0}.appframe{display:none;grid-template-columns:264px minmax(0,1fr);min-height:100vh}.auth-ready .appframe{display:grid}.authscreen{align-items:center;display:grid;min-height:100vh;padding:24px}.auth-ready .authscreen{display:none}.authcard{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.94));border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:18px;margin:auto;max-width:440px;padding:28px;width:100%}.authbrand{align-items:center;display:flex;gap:12px}.authbrand img{background:#fff;border:1px solid var(--line);border-radius:10px;height:58px;object-fit:contain;padding:5px;width:92px}.authcard h1{font-size:1.75rem;line-height:1.1}.authcopy{color:var(--muted);line-height:1.55}.authform{display:grid;gap:11px}.authform label{color:var(--muted);font-size:.74rem;font-weight:850;text-transform:uppercase}.authpanel{background:#f8faf6;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:.88rem;line-height:1.45;padding:12px}.accountbar{border-top:1px solid rgba(255,255,255,.12);display:grid;gap:10px;margin-top:16px;padding-top:16px}.accountbar span{color:#c7d8cc;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.accountbar .role{color:#9eb4a4;font-size:.72rem;text-transform:uppercase;font-weight:800}.accountbar button{background:transparent;border-color:rgba(255,255,255,.18);color:#dceade;justify-content:flex-start}.sidebar{background:#15291d;color:#dceade;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;overflow:auto}.brand{align-items:center;display:flex;gap:11px;margin-bottom:24px}.logo{background:#fff;border-radius:10px;display:block;height:46px;object-fit:contain;padding:5px;width:76px}.brand strong{display:block;font-size:1.02rem}.brand span{color:#9eb4a4;font-size:.78rem}.tabs{display:grid;gap:6px}.tabs button{background:transparent;border:1px solid transparent;color:#c7d8cc;justify-content:flex-start;padding:10px 12px}.tabs button:hover{background:rgba(255,255,255,.08);box-shadow:none}.tabs button.active{background:#e7f2e9;color:#183823}.sidefoot{border-top:1px solid rgba(255,255,255,.12);color:#98afa0;font-size:.78rem;line-height:1.45;margin-top:auto;padding-top:16px}.shell{max-width:1600px;padding:24px 28px 40px}.topbar{align-items:center;display:grid;gap:18px;grid-template-columns:minmax(0,1fr) 450px;margin-bottom:18px}.titleblock h1{font-size:clamp(1.8rem,3vw,3.1rem);letter-spacing:0;line-height:1.02}.copy{color:var(--muted);font-size:1rem;line-height:1.55;margin-top:10px;max-width:850px}.eyebrow{color:var(--accent);font-size:.72rem;font-weight:850;letter-spacing:0;text-transform:uppercase}.datebox{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:10px;grid-template-columns:1fr 1fr auto;padding:14px}.datebox label{color:var(--muted);font-size:.74rem;font-weight:800;text-transform:uppercase}.datefield{display:grid;gap:5px}.metrics{display:grid;gap:12px;grid-template-columns:repeat(5,minmax(0,1fr));margin:16px 0}.metric{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 22px rgba(23,33,27,.05);display:grid;gap:9px;min-height:104px;padding:16px;position:relative}.metric:before{background:var(--brand);border-radius:10px 0 0 10px;content:"";inset:0 auto 0 0;position:absolute;width:4px}.metric span{color:var(--muted);font-size:.75rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:clamp(1.25rem,2vw,1.85rem);letter-spacing:0}.view{display:none}.view.active{display:block}.grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:1.1fr 1fr 1fr}.panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(255,255,255,.92));border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 28px rgba(23,33,27,.05);padding:18px}.wide{grid-column:1/-1}.heading{align-items:end;display:flex;gap:12px;justify-content:space-between;margin-bottom:14px}.heading h2{font-size:1.2rem;line-height:1.2;margin-top:3px}.subcopy{color:var(--muted);font-size:.86rem;line-height:1.45;margin-top:5px}.formgrid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.formgrid button{align-self:end}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{display:flex;flex-wrap:wrap;gap:9px}.tablewrap{border:1px solid var(--line);border-radius:9px;overflow:auto}table{border-collapse:separate;border-spacing:0;width:100%}th,td{border-bottom:1px solid var(--line2);font-size:.86rem;padding:10px 11px;text-align:left;white-space:nowrap}tr:last-child td{border-bottom:0}th{background:#f6f8f4;color:var(--muted);font-size:.72rem;font-weight:850;position:sticky;text-transform:uppercase;top:0}td:first-child{color:var(--ink);font-weight:780}.num{text-align:right}.pill{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:var(--brand2);display:inline-flex;font-size:.76rem;font-weight:820;padding:4px 8px;text-transform:capitalize}.pill.warn{background:#fff5dc;border-color:#ecd28c;color:#6b4d0d}.pill.bad{background:#fff0ee;border-color:#edc4bf;color:var(--bad)}.rates{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}.rate{background:linear-gradient(180deg,#fbfcf9,#eef5ee);border:1px solid var(--line);border-radius:10px;display:grid;gap:9px;min-height:132px;padding:15px}.rate strong{font-size:1.55rem}.rate span,.rate small{color:var(--muted)}.notice{background:#fff8e8;border:1px solid #ead394;border-radius:9px;color:#61470d;line-height:1.45;padding:12px}.printHint,.status{color:var(--muted);font-size:.86rem;line-height:1.45;min-height:22px}.danger:not(button){color:var(--bad)}.sectiongap{display:grid;gap:12px}.toast{background:#182d20;border-radius:8px;bottom:18px;box-shadow:var(--shadow);color:#fff;display:none;font-weight:760;left:50%;padding:11px 14px;position:fixed;transform:translateX(-50%);z-index:20}.toast.show{display:block}
.modal-backdrop{align-items:center;background:rgba(15,20,16,.55);display:none;inset:0;justify-content:center;padding:20px;position:fixed;z-index:40}.modal-backdrop.show{display:flex}.modal{background:#fff;border-radius:12px;box-shadow:var(--shadow);max-height:88vh;max-width:640px;overflow:auto;padding:20px;width:100%}.modal-head{align-items:center;display:flex;justify-content:space-between;margin-bottom:14px}.modal-head button{background:transparent;border:0;color:var(--muted);font-size:1.3rem;min-height:auto;padding:2px 6px}.balance-due{color:var(--bad);font-weight:800}.balance-clear{color:var(--ok);font-weight:800}.rowline{align-items:center;display:flex;gap:8px}
@media(max-width:1120px){.appframe{grid-template-columns:1fr}.sidebar{height:auto;position:static}.tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.sidefoot{display:none}.topbar,.grid,.grid.three{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rates,.formgrid,.four,.five{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){body{font-size:13px}.shell{padding:14px}.sidebar{padding:14px}.tabs{grid-template-columns:1fr 1fr}.topbar{gap:12px}.datebox,.metrics,.rates,.formgrid,.two,.four,.five{grid-template-columns:1fr}.heading{align-items:start;flex-direction:column}.titleblock h1{font-size:2rem}}
`;
var CLIENT_SCRIPT = `
const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];
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
  $("mForm").onsubmit = async e => { e.preventDefault(); await api("/api/farmers/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Farmer updated"); await load(); };
}
function payFarmer(row) {
  openModal("Record payment - " + row.name, '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Date", '<input name="payment_date" type="date" value="' + todayStr + '" required>') +
    fld("Amount", '<input name="amount" type="number" min="0" step="0.01" required>') +
    fld("Mode", '<select name="mode"><option value="cash">Cash</option><option value="bank">Bank transfer</option><option value="upi">UPI</option><option value="other">Other</option></select>') +
    '</div>' + fld("Notes", '<textarea name="notes" placeholder="Advance, weekly settlement, etc."></textarea>') +
    '<button>Save payment</button></form>');
  $("mForm").onsubmit = async e => { e.preventDefault(); await api("/api/farmer-payments", Object.assign({ farmer_id: row.id }, formData(e.target))); closeModal(); showToast("Payment recorded"); await load(); };
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
  $("mForm").onsubmit = async e => { e.preventDefault(); await api("/api/vendors/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Vendor updated"); await load(); };
}
function editPurchase(row) {
  openModal("Edit purchase", '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Date", '<input name="purchase_date" type="date" value="' + esc(row.purchase_date) + '" required>') +
    fld("Farmer", '<select name="farmer_id">' + farmerOptionsWith(row.farmer_id) + '</select>') +
    fld("Banana type", '<select name="banana_type">' + bananaOptionsWith(row.banana_type) + '</select>') +
    fld("Bunches", '<input name="bunches" type="number" min="0" step="0.01" value="' + esc(row.bunches) + '">') +
    fld("Weight kg", '<input name="weight_kg" type="number" min="0" step="0.01" value="' + esc(row.weight_kg) + '" required>') +
    fld("Rate / kg", '<input name="rate" type="number" min="0" step="0.01" value="' + esc(row.rate) + '" required>') +
    fld("Vehicle", '<select name="vehicle_no">' + vehicleOptionsWith(row.vehicle_no) + '</select>') +
    fld("Trip", '<select name="trip_id">' + tripOptionsWith(row.trip_id) + '</select>') +
    '</div>' + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = async e => { e.preventDefault(); await api("/api/purchases/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Purchase updated"); await load(); };
}
function editSale(row) {
  openModal("Edit sale", '<form id="mForm" class="sectiongap"><div class="formgrid two">' +
    fld("Date", '<input name="sale_date" type="date" value="' + esc(row.sale_date) + '" required>') +
    fld("Vendor", '<select name="vendor_id">' + vendorOptionsWith(row.vendor_id) + '</select>') +
    fld("Banana type", '<select name="banana_type">' + bananaOptionsWith(row.banana_type) + '</select>') +
    fld("Weight kg", '<input name="weight_kg" type="number" min="0" step="0.01" value="' + esc(row.weight_kg) + '" required>') +
    fld("Rate / kg", '<input name="rate" type="number" min="0" step="0.01" value="' + esc(row.rate) + '" required>') +
    fld("Paid", '<input name="paid" type="number" min="0" step="0.01" value="' + esc(row.paid) + '">') +
    fld("Vehicle", '<select name="vehicle_no">' + vehicleOptionsWith(row.vehicle_no) + '</select>') +
    fld("Trip", '<select name="trip_id">' + tripOptionsWith(row.trip_id) + '</select>') +
    '</div>' + fld("Notes", '<textarea name="notes">' + esc(row.notes) + '</textarea>') +
    '<button>Save changes</button></form>');
  $("mForm").onsubmit = async e => { e.preventDefault(); await api("/api/sales/update", Object.assign({ id: row.id }, formData(e.target))); closeModal(); showToast("Sale updated"); await load(); };
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
  $("mForm").onsubmit = async e => { e.preventDefault(); await api("/api/trip-expenses", Object.assign({ trip_id: id }, formData(e.target))); showToast("Expense added"); await viewTrip(id); await load(); };
  $("modalBody").onclick = async e => { if (e.target.dataset.delExpense) { await api("/api/trip-expenses/delete", { id: Number(e.target.dataset.delExpense) }); await viewTrip(id); await load(); } };
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
  $("rateCards").innerHTML = BANANAS.map(b => {
    const r = state.rates.find(x => x.rate_date === d && x.banana_type === b);
    const week = state.rates.filter(x => x.banana_type === b).map(x => x.sell_rate);
    const avg = week.reduce((a,n) => a + Number(n), 0) / (week.length || 1);
    return '<article class="rate"><h3>' + b + '</h3><strong>' + (r ? rs(r.sell_rate) : "No rate") + '</strong><span>Buy ' + (r ? rs(r.buy_rate) : "-") + '</span><small>7-day avg sell ' + rs(avg) + '</small></article>';
  }).join("");
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
    raw(x.status === "pending" ? '<button type="button" data-approve-batch="' + x.id + '">Approve</button> <button type="button" class="danger" data-reject-batch="' + x.id + '">Reject</button>' : '-')
  ]));
  $("transactionTables").innerHTML = "<h3>Purchases</h3>" + table(["Date","Farmer","Type","Bunches","Kg","Rate","Value","Vehicle","Actions"], dailyPurchases.map(x => [x.purchase_date,x.farmer_name,x.banana_type,x.bunches,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),x.vehicle_no,
    raw('<div class="actions"><button type="button" class="secondary small" data-edit-purchase="' + x.id + '">Edit</button> <button type="button" class="danger small" data-del-purchase="' + x.id + '">Delete</button></div>')]))
    + "<h3>Sales</h3>" + table(["Date","Vendor","Type","Kg","Rate","Value","Paid","Vehicle","Actions"], dailySales.map(x => [x.sale_date,x.vendor_name,x.banana_type,kg(x.weight_kg),rs(x.rate),rs(x.weight_kg*x.rate),rs(x.paid),x.vehicle_no,
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
async function save(path, form, extra) { await api(path, Object.assign(formData(form), extra || {})); form.reset(); showToast("Saved successfully"); await load(); }
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
  if (e.target.dataset.approveBatch) { await api("/api/cutter/approve", { id: Number(e.target.dataset.approveBatch) }); showToast("Batch approved as purchase"); await load(); }
  if (e.target.dataset.rejectBatch) { await api("/api/cutter/reject", { id: Number(e.target.dataset.rejectBatch) }); showToast("Batch rejected"); await load(); }
};
$("farmersTable").onclick = async e => {
  const t = e.target.dataset;
  if (t.editFarmer) editFarmer(state.farmers.find(x => x.id === Number(t.editFarmer)));
  if (t.payFarmer) payFarmer(state.farmers.find(x => x.id === Number(t.payFarmer)));
  if (t.ledgerFarmer) viewLedger(state.farmers.find(x => x.id === Number(t.ledgerFarmer)));
  if (t.delFarmer && confirm("Delete this farmer? Historical purchases stay on record.")) { await api("/api/farmers/delete", { id: Number(t.delFarmer) }); showToast("Farmer deleted"); await load(); }
};
$("vendorsTable").onclick = async e => {
  const t = e.target.dataset;
  if (t.editVendor) editVendor(state.vendors.find(x => x.id === Number(t.editVendor)));
  if (t.delVendor && confirm("Delete this vendor? Historical sales stay on record.")) { await api("/api/vendors/delete", { id: Number(t.delVendor) }); showToast("Vendor deleted"); await load(); }
};
$("vehiclesTable").onclick = async e => {
  if (e.target.dataset.delVehicle && confirm("Remove this vehicle?")) { await api("/api/vehicles/delete", { id: Number(e.target.dataset.delVehicle) }); showToast("Vehicle removed"); await load(); }
};
$("transactionTables").onclick = async e => {
  const t = e.target.dataset;
  if (t.editPurchase) editPurchase(state.purchases.find(x => x.id === Number(t.editPurchase)));
  if (t.editSale) editSale(state.sales.find(x => x.id === Number(t.editSale)));
  if (t.delPurchase && confirm("Delete this purchase entry?")) { await api("/api/purchases/delete", { id: Number(t.delPurchase) }); showToast("Purchase deleted"); await load(); }
  if (t.delSale && confirm("Delete this sale entry?")) { await api("/api/sales/delete", { id: Number(t.delSale) }); showToast("Sale deleted"); await load(); }
};
$("tripsTable").onclick = async e => {
  const t = e.target.dataset;
  if (t.viewTrip) viewTrip(Number(t.viewTrip));
  if (t.settleTrip) { await api("/api/trips/settle", { id: Number(t.settleTrip) }); showToast("Trip settled"); await load(); }
  if (t.delTrip && confirm("Delete this trip? Linked entries stay on record.")) { await api("/api/trips/delete", { id: Number(t.delTrip) }); showToast("Trip deleted"); await load(); }
};
$("invoiceTable").onclick = async e => {
  if (e.target.dataset.voidInvoice && confirm("Void this invoice?")) { await api("/api/invoices/void", { id: Number(e.target.dataset.voidInvoice) }); showToast("Invoice voided"); await load(); }
};
$("staffTable").onclick = async e => {
  if (e.target.dataset.toggleStaff) { await api("/api/staff/toggle", { id: Number(e.target.dataset.toggleStaff), active: e.target.dataset.active !== "1" }); showToast("Staff updated"); await load(); }
};
$("activityTable").onclick = e => {
  if (e.target.dataset.viewAudit) {
    const row = state.auditLogs.find(x => x.id === Number(e.target.dataset.viewAudit));
    openModal("Audit entry #" + row.id, '<pre style="white-space:pre-wrap;font-size:.82rem">Before:\\n' + esc(row.before_json || "(none)") + '\\n\\nAfter:\\n' + esc(row.after_json || "(none)") + '</pre>');
  }
};
$("invoiceForm").party_type.onchange = e => { document.querySelector('#invoiceForm select[name="party_id"]').innerHTML = options(e.target.value === "vendor" ? state.vendors : state.farmers, "party"); };
$("invoiceForm").from_date.value = todayStr.slice(0,8) + "01"; $("invoiceForm").to_date.value = todayStr;
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
`;
var BODY = `
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
          <div class="heading"><div><p class="eyebrow">Inbound</p><h2>Purchase from farmer</h2><p class="subcopy">Record vehicle loads as they arrive from farms. Attach a trip if you're tracking that vehicle's costs.</p></div></div>
          <form class="formgrid two" id="purchaseForm">
            <select name="farmer_id" required></select><select name="banana_type"></select>
            <input name="bunches" type="number" min="0" step="0.01" placeholder="Bunches"><input name="weight_kg" type="number" min="0" step="0.01" placeholder="Weight kg" required>
            <input name="rate" type="number" min="0" step="0.01" placeholder="Rate / kg" required><select name="vehicle_no" required></select>
            <select name="trip_id"></select><textarea name="notes" placeholder="Notes"></textarea><button>Save purchase</button>
          </form>
        </div>
        <div class="panel">
          <div class="heading"><div><p class="eyebrow">Outbound</p><h2>Sale to vendor</h2><p class="subcopy">Capture dispatch weight, sale rate, payment, and vehicle number.</p></div></div>
          <form class="formgrid two" id="saleForm">
            <select name="vendor_id" required></select><select name="banana_type"></select>
            <input name="weight_kg" type="number" min="0" step="0.01" placeholder="Weight kg" required><input name="rate" type="number" min="0" step="0.01" placeholder="Sale rate / kg" required>
            <input name="paid" type="number" min="0" step="0.01" placeholder="Amount paid"><select name="vehicle_no" required></select>
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
function appShell() {
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KMS Banana Desk</title>
  <style>${STYLE}</style>
</head>
<body>${BODY}
  <script>${CLIENT_SCRIPT}<\/script>
</body>
</html>`;
}
//#endregion
//#region worker/audit.ts
async function writeAudit(db, entityType, entityId, action, changedBy, before, after) {
	await db.prepare("INSERT INTO audit_logs (entity_type, entity_id, action, changed_by, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)").bind(entityType, entityId, action, changedBy || "", before ? JSON.stringify(before) : "", after ? JSON.stringify(after) : "").run();
}
async function recentAudit(db, limit = 60) {
	return (await db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?").bind(limit).all()).results || [];
}
//#endregion
//#region worker/invoices.ts
async function generateInvoice(db, input, changedBy) {
	const partyType = input.party_type === "vendor" ? "vendor" : "farmer";
	const partyId = Number(input.party_id);
	const fromDate = String(input.from_date);
	const toDate = String(input.to_date);
	const rows = partyType === "vendor" ? await all(db, "SELECT id, sale_date AS item_date, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE vendor_id = ? AND sale_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY sale_date, id", partyId, fromDate, toDate) : await all(db, "SELECT id, purchase_date AS item_date, banana_type, weight_kg, rate, bunches, vehicle_no, notes, 0 AS paid FROM purchases WHERE farmer_id = ? AND purchase_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date, id", partyId, fromDate, toDate);
	const party = partyType === "vendor" ? await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(partyId).first() : await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(partyId).first();
	const total = rows.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
	const paid = partyType === "vendor" ? rows.reduce((sum, row) => sum + Number(row.paid || 0), 0) : Number((await db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM farmer_payments WHERE farmer_id = ? AND payment_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL)").bind(partyId, fromDate, toDate).first())?.total || 0);
	const invoiceNo = `${partyType === "vendor" ? "VEND" : "FARM"}-${Date.now()}`;
	const invoiceDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const invoiceId = (await db.prepare("INSERT INTO invoices (invoice_no, party_type, party_id, party_name, from_date, to_date, invoice_date, total, paid, pending, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceNo, partyType, partyId, party?.name || "Unknown", fromDate, toDate, invoiceDate, total, paid, total - paid, total - paid > 0 ? "open" : "paid").run()).meta.last_row_id;
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
	await writeAudit(db, "invoice", invoiceId, "create", changedBy, null, {
		invoice_no: invoiceNo,
		party_type: partyType,
		party_id: partyId,
		total,
		paid
	});
	return invoiceId;
}
async function voidInvoice(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE invoices SET status = 'void' WHERE id = ?").bind(id).run();
	await writeAudit(db, "invoice", id, "void", changedBy, before, { status: "void" });
}
async function logoDataUrl(env) {
	try {
		if (!env?.ASSETS) return "/logo.png";
		const response = await env.ASSETS.fetch(new Request("https://assets.local/logo.png"));
		if (!response.ok) return "/logo.png";
		return `data:image/png;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
	} catch {
		return "/logo.png";
	}
}
async function invoiceLineDescription(db, item) {
	if (item.item_type === "purchase") {
		const source = await db.prepare("SELECT banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE id = ?").bind(Number(item.source_id)).first();
		if (source) return [
			source.banana_type,
			source.vehicle_no ? `Vehicle ${source.vehicle_no}` : "",
			source.bunches ? `Units ${source.bunches}` : "",
			source.notes || ""
		].filter(Boolean).join(" | ");
	}
	if (item.item_type === "sale") {
		const source = await db.prepare("SELECT banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE id = ?").bind(Number(item.source_id)).first();
		if (source) return [
			source.banana_type,
			source.vehicle_no ? `Vehicle ${source.vehicle_no}` : "",
			source.notes || ""
		].filter(Boolean).join(" | ");
	}
	return item.description;
}
async function invoiceHtml(db, id, env) {
	const invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(Number(id)).first();
	if (!invoice) return html("Invoice not found", 404);
	const items = await all(db, "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_date, id", Number(id));
	const logoSrc = await logoDataUrl(env);
	const rows = (await Promise.all(items.map(async (item) => {
		const description = await invoiceLineDescription(db, item);
		return `<tr><td>${e(item.item_date)}</td><td>${e(description)}</td><td class="num">${e(item.quantity_kg)}</td><td class="num">${money(item.rate)}</td><td class="num">${money(item.amount)}</td></tr>`;
	}))).join("");
	const voidBadge = invoice.status === "void" ? "<span class=\"badge\" style=\"background:#fff0ee;border-color:#edc4bf;color:#b3463c\">VOID</span>" : `<span class="badge">${e(invoice.status)}</span>`;
	return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>*{box-sizing:border-box}body{background:radial-gradient(circle at 85% 6%,rgba(255,205,49,.24),transparent 260px),#f4f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;margin:0;padding:28px}.sheet{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,255,255,.94)),radial-gradient(circle at 90% 12%,rgba(255,209,58,.22),transparent 280px);border:1px solid #dce3d8;margin:auto;max-width:920px;overflow:hidden;padding:34px;position:relative}.sheet:after{color:rgba(217,173,58,.08);content:"KMS BANANA";font-size:5rem;font-weight:900;position:absolute;right:-20px;top:44%;transform:rotate(-18deg);z-index:0}.sheet>*{position:relative;z-index:1}.actions{margin:0 auto 16px;max-width:920px}button{background:#2f6b43;border:0;border-radius:7px;color:#fff;font-weight:700;padding:10px 14px}.top{align-items:start;border-bottom:3px solid #2f6b43;display:grid;grid-template-columns:1fr auto;gap:24px;padding-bottom:22px}.brandrow{align-items:center;display:flex;gap:14px}.brandrow img{height:72px;object-fit:contain;width:150px}.brand{font-size:1.8rem;font-weight:900}.muted{color:#66736a}.badge{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:#184c2c;display:inline-block;font-size:.78rem;font-weight:800;margin-top:8px;padding:5px 10px;text-transform:uppercase}.meta{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px;margin:24px 0}.box{border:1px solid #dce3d8;border-radius:8px;padding:14px}.label{color:#66736a;font-size:.72rem;font-weight:800;text-transform:uppercase}.value{font-size:1rem;font-weight:800;margin-top:5px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e8ede4;padding:11px 9px;text-align:left}th{background:#f6f8f4;color:#66736a;font-size:.72rem;text-transform:uppercase}.num{text-align:right}.totals{margin-left:auto;margin-top:24px;width:340px}.totals td,.totals th{border:1px solid #dce3d8}.totals .due{background:#fff7df;font-size:1.05rem}.footer{border-top:1px solid #dce3d8;color:#66736a;font-size:.85rem;margin-top:34px;padding-top:14px}@media print{body{background:#fff;padding:0}.actions{display:none}.sheet{border:0;max-width:none;padding:20px}}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet"><section class="top"><div class="brandrow"><img src="${logoSrc}" alt="KMS Banana logo"><div><div class="brand">KMS Banana</div><p class="muted">Banana merchant purchase and sales billing</p></div></div><div><h1>Invoice</h1><p class="muted">${e(invoice.invoice_no)}</p>${voidBadge}</div></section><section class="meta"><div class="box"><div class="label">Party</div><div class="value">${e(invoice.party_name)}</div><p class="muted">${e(invoice.party_type)} invoice</p></div><div class="box"><div class="label">Invoice date</div><div class="value">${e(invoice.invoice_date)}</div></div><div class="box"><div class="label">Period</div><div class="value">${e(invoice.from_date)} to ${e(invoice.to_date)}</div></div></section><table><thead><tr><th>Date</th><th>Description</th><th class="num">Kg</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table><p class="footer">Generated from saved purchase and sales records in KMS Banana Desk.</p></main></body></html>`);
}
//#endregion
//#region worker/masters.ts
async function listFarmers(db) {
	return all(db, `SELECT f.*, COALESCE(p.total, 0) AS purchase_total, COALESCE(pay.total, 0) AS paid_total,
            COALESCE(p.total, 0) - COALESCE(pay.total, 0) AS balance
     FROM farmers f
     LEFT JOIN (SELECT farmer_id, SUM(weight_kg * rate) AS total FROM purchases WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY farmer_id) p ON p.farmer_id = f.id
     LEFT JOIN (SELECT farmer_id, SUM(amount) AS total FROM farmer_payments WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY farmer_id) pay ON pay.farmer_id = f.id
     WHERE f.deleted_at = '' OR f.deleted_at IS NULL
     ORDER BY f.name`);
}
async function listVendors(db) {
	return all(db, `SELECT v.*, COALESCE(s.total, 0) AS sale_total, COALESCE(s.paid, 0) AS paid_total,
            COALESCE(s.total, 0) - COALESCE(s.paid, 0) AS balance
     FROM vendors v
     LEFT JOIN (SELECT vendor_id, SUM(weight_kg * rate) AS total, SUM(paid) AS paid FROM sales WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY vendor_id) s ON s.vendor_id = v.id
     WHERE v.deleted_at = '' OR v.deleted_at IS NULL
     ORDER BY v.name`);
}
async function listVehicles(db) {
	return all(db, "SELECT * FROM vehicles WHERE (deleted_at = '' OR deleted_at IS NULL) AND active = 1 ORDER BY vehicle_no");
}
async function createFarmer(db, input, changedBy) {
	await writeAudit(db, "farmer", (await db.prepare("INSERT INTO farmers (name, phone, village, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.notes || "").run()).meta.last_row_id, "create", changedBy, null, input);
}
async function updateFarmer(db, id, input, changedBy) {
	const before = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE farmers SET name = ?, phone = ?, village = ?, address = ?, gst = ?, notes = ? WHERE id = ?").bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.notes || "", id).run();
	await writeAudit(db, "farmer", id, "update", changedBy, before, input);
}
async function deleteFarmer(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE farmers SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "farmer", id, "delete", changedBy, before, null);
}
async function createVendor(db, input, changedBy) {
	await writeAudit(db, "vendor", (await db.prepare("INSERT INTO vendors (name, phone, market, address, gst, notes) VALUES (?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.notes || "").run()).meta.last_row_id, "create", changedBy, null, input);
}
async function updateVendor(db, id, input, changedBy) {
	const before = await db.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE vendors SET name = ?, phone = ?, market = ?, address = ?, gst = ?, notes = ? WHERE id = ?").bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.notes || "", id).run();
	await writeAudit(db, "vendor", id, "update", changedBy, before, input);
}
async function deleteVendor(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE vendors SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "vendor", id, "delete", changedBy, before, null);
}
async function createVehicle(db, input, changedBy) {
	await db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone, notes) VALUES (?, ?, ?, ?) ON CONFLICT(vehicle_no) DO UPDATE SET driver_name = excluded.driver_name, phone = excluded.phone, notes = excluded.notes, active = 1").bind(input.vehicle_no, input.driver_name || "", input.phone || "", input.notes || "").run();
	await writeAudit(db, "vehicle", 0, "create", changedBy, null, input);
}
async function deleteVehicle(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM vehicles WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE vehicles SET active = 0, deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "vehicle", id, "delete", changedBy, before, null);
}
async function createRate(db, input, changedBy) {
	const before = await db.prepare("SELECT * FROM banana_rates WHERE rate_date = ? AND banana_type = ?").bind(input.rate_date, input.banana_type).first();
	await db.prepare("INSERT INTO banana_rates (rate_date, banana_type, buy_rate, sell_rate) VALUES (?, ?, ?, ?) ON CONFLICT(rate_date, banana_type) DO UPDATE SET buy_rate = excluded.buy_rate, sell_rate = excluded.sell_rate").bind(input.rate_date, input.banana_type, Number(input.buy_rate), Number(input.sell_rate)).run();
	await writeAudit(db, "banana_rate", 0, before ? "update" : "create", changedBy, before, input);
}
//#endregion
//#region worker/payments.ts
async function listFarmerPayments(db, farmerId) {
	if (farmerId) return all(db, "SELECT p.*, f.name AS farmer_name FROM farmer_payments p JOIN farmers f ON f.id = p.farmer_id WHERE p.farmer_id = ? AND (p.deleted_at = '' OR p.deleted_at IS NULL) ORDER BY p.payment_date DESC, p.id DESC", farmerId);
	return all(db, "SELECT p.*, f.name AS farmer_name FROM farmer_payments p JOIN farmers f ON f.id = p.farmer_id WHERE p.deleted_at = '' OR p.deleted_at IS NULL ORDER BY p.payment_date DESC, p.id DESC LIMIT 200");
}
async function farmerLedger(db, farmerId) {
	return {
		purchases: await all(db, "SELECT id, purchase_date AS date, banana_type, weight_kg, rate, (weight_kg * rate) AS amount, vehicle_no FROM purchases WHERE farmer_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date, id", farmerId),
		payments: await all(db, "SELECT id, payment_date AS date, amount, mode, notes FROM farmer_payments WHERE farmer_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY payment_date, id", farmerId)
	};
}
async function createFarmerPayment(db, input, changedBy) {
	await writeAudit(db, "farmer_payment", (await db.prepare("INSERT INTO farmer_payments (payment_date, farmer_id, amount, mode, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)").bind(input.payment_date, Number(input.farmer_id), Number(input.amount), String(input.mode || "cash"), input.notes || "", changedBy).run()).meta.last_row_id, "create", changedBy, null, input);
}
async function deleteFarmerPayment(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM farmer_payments WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE farmer_payments SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "farmer_payment", id, "delete", changedBy, before, null);
}
//#endregion
//#region worker/purchases.ts
async function createPurchase(db, input, changedBy) {
	const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first();
	await writeAudit(db, "purchase", (await db.prepare("INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(input.purchase_date, Number(input.farmer_id), farmer?.name || "Unknown farmer", input.banana_type, Number(input.bunches || 0), Number(input.weight_kg), Number(input.rate), input.vehicle_no, input.notes || "", input.trip_id ? Number(input.trip_id) : null).run()).meta.last_row_id, "create", changedBy, null, input);
}
async function updatePurchase(db, id, input, changedBy) {
	const before = await db.prepare("SELECT * FROM purchases WHERE id = ?").bind(id).first();
	const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first();
	await db.prepare("UPDATE purchases SET purchase_date = ?, farmer_id = ?, farmer_name = ?, banana_type = ?, bunches = ?, weight_kg = ?, rate = ?, vehicle_no = ?, notes = ?, trip_id = ? WHERE id = ?").bind(input.purchase_date, Number(input.farmer_id), farmer?.name || "Unknown farmer", input.banana_type, Number(input.bunches || 0), Number(input.weight_kg), Number(input.rate), input.vehicle_no, input.notes || "", input.trip_id ? Number(input.trip_id) : null, id).run();
	await writeAudit(db, "purchase", id, "update", changedBy, before, input);
}
async function deletePurchase(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM purchases WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE purchases SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "purchase", id, "delete", changedBy, before, null);
}
function netWeight(entry) {
	return Math.max(0, Number(entry.weight_kg || 0) - Number(entry.units || 0) * Number(entry.stem_reduction_per_unit || 0));
}
async function submitCutterBatch(db, input, changedBy) {
	const farmerName = (await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first())?.name || "Unknown farmer";
	const batchId = (await db.prepare("INSERT INTO cutter_batches (batch_date, farmer_id, farmer_name, banana_type, vehicle_no, submitted_by, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')").bind(input.batch_date, Number(input.farmer_id), farmerName, input.banana_type, input.vehicle_no, input.submitted_by || "").run()).meta.last_row_id;
	const entries = Array.isArray(input.entries) ? input.entries : [];
	for (const entry of entries) await db.prepare("INSERT INTO cutter_entries (batch_id, gross_weight_kg, units, stem_reduction_per_unit, net_weight_kg, grade, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(batchId, Number(entry.weight_kg), Number(entry.units), Number(entry.stem_reduction_per_unit || 0), netWeight(entry), entry.grade || "1st grade", entry.notes || "").run();
	await db.prepare("INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)").bind("cutter_batch", batchId, "pending", `Cutter batch submitted by ${input.submitted_by || "cutter"} for ${farmerName}`).run();
	await writeAudit(db, "cutter_batch", batchId, "create", changedBy, null, input);
	return batchId;
}
async function approveCutterBatch(db, input, changedBy) {
	const id = Number(input.id);
	const batch = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(id).first();
	if (!batch) throw new Error("Batch not found");
	if (batch.status !== "pending") return id;
	const rate = await db.prepare("SELECT buy_rate FROM banana_rates WHERE rate_date = ? AND banana_type = ?").bind(batch.batch_date, batch.banana_type).first();
	const buyRate = Number(rate?.buy_rate || 0);
	const entries = await all(db, "SELECT * FROM cutter_entries WHERE batch_id = ? ORDER BY id", id);
	for (const entry of entries) {
		const notes = `Cutter batch #${batch.id}; ${entry.grade}; gross ${entry.gross_weight_kg} kg; units ${entry.units}; stem reduction ${entry.stem_reduction_per_unit}/unit`;
		await db.prepare("INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(batch.batch_date, batch.farmer_id, batch.farmer_name, batch.banana_type, Number(entry.units), Number(entry.net_weight_kg), buyRate, batch.vehicle_no, notes).run();
	}
	await db.prepare("UPDATE cutter_batches SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?").bind(changedBy || "Admin", id).run();
	await db.prepare("INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)").bind("cutter_batch", id, "approved", `Cutter batch approved and converted to ${entries.length} purchase entries`).run();
	await writeAudit(db, "cutter_batch", id, "approve", changedBy, batch, { status: "approved" });
	return id;
}
async function rejectCutterBatch(db, input, changedBy) {
	const id = Number(input.id);
	const before = await db.prepare("SELECT * FROM cutter_batches WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE cutter_batches SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ? AND status = 'pending'").bind(changedBy || "Admin", id).run();
	await db.prepare("INSERT INTO activity_logs (log_type, reference_id, status, message) VALUES (?, ?, ?, ?)").bind("cutter_batch", id, "rejected", "Cutter batch rejected").run();
	await writeAudit(db, "cutter_batch", id, "reject", changedBy, before, { status: "rejected" });
}
//#endregion
//#region worker/sales.ts
async function createSale(db, input, changedBy) {
	const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first();
	await writeAudit(db, "sale", (await db.prepare("INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(input.sale_date, Number(input.vendor_id), vendor?.name || "Unknown vendor", input.banana_type, Number(input.weight_kg), Number(input.rate), Number(input.paid || 0), input.vehicle_no, input.notes || "", input.trip_id ? Number(input.trip_id) : null).run()).meta.last_row_id, "create", changedBy, null, input);
}
async function updateSale(db, id, input, changedBy) {
	const before = await db.prepare("SELECT * FROM sales WHERE id = ?").bind(id).first();
	const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first();
	await db.prepare("UPDATE sales SET sale_date = ?, vendor_id = ?, vendor_name = ?, banana_type = ?, weight_kg = ?, rate = ?, paid = ?, vehicle_no = ?, notes = ?, trip_id = ? WHERE id = ?").bind(input.sale_date, Number(input.vendor_id), vendor?.name || "Unknown vendor", input.banana_type, Number(input.weight_kg), Number(input.rate), Number(input.paid || 0), input.vehicle_no, input.notes || "", input.trip_id ? Number(input.trip_id) : null, id).run();
	await writeAudit(db, "sale", id, "update", changedBy, before, input);
}
async function deleteSale(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM sales WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE sales SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "sale", id, "delete", changedBy, before, null);
}
//#endregion
//#region worker/reports.ts
async function dailyReport(db, reportDate) {
	const purchases = await all(db, "SELECT * FROM purchases WHERE purchase_date = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", reportDate);
	const sales = await all(db, "SELECT * FROM sales WHERE sale_date = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", reportDate);
	const pv = purchases.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
	const sv = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate), 0);
	const pending = sales.reduce((sum, row) => sum + Number(row.weight_kg) * Number(row.rate) - Number(row.paid), 0);
	return [
		`KMS Banana Daily Report - ${reportDate}`,
		`Purchase value: ${money(pv)}`,
		`Sales value: ${money(sv)}`,
		`Pending collection: ${money(pending)}`,
		"",
		"Purchases:",
		...purchases.map((row) => `${row.farmer_name} | ${row.banana_type} | ${row.weight_kg} kg | ${money(Number(row.weight_kg) * Number(row.rate))} | ${row.vehicle_no}`),
		"",
		"Sales:",
		...sales.map((row) => `${row.vendor_name} | ${row.banana_type} | ${row.weight_kg} kg | ${money(Number(row.weight_kg) * Number(row.rate))} | paid ${money(row.paid)} | ${row.vehicle_no}`)
	].join("\n");
}
async function sendDailyEmail(db, env, reportDate) {
	const recipients = (await db.prepare("SELECT value FROM settings WHERE key = ?").bind("daily_email_recipients").first())?.value || "";
	const subject = `Banana merchant daily report ${reportDate}`;
	const body = await dailyReport(db, reportDate);
	let status = "draft";
	let message = "Email provider is not configured. Report was saved as a draft log.";
	if (recipients) {
		const delivery = await sendEmail(env, recipients.split(",").map((x) => x.trim()).filter(Boolean), subject, body);
		status = delivery.sent ? "sent" : "failed";
		message = delivery.message;
	}
	await db.prepare("INSERT INTO email_logs (report_date, recipients, subject, body, status, provider_message) VALUES (?, ?, ?, ?, ?, ?)").bind(reportDate, recipients, subject, body, status, message).run();
	return {
		status,
		message
	};
}
//#endregion
//#region worker/schema.ts
var TABLES = [
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
	"CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'staff', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
	"CREATE TABLE IF NOT EXISTS farmer_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, payment_date TEXT NOT NULL, farmer_id INTEGER NOT NULL, amount REAL NOT NULL, mode TEXT NOT NULL DEFAULT 'cash', notes TEXT DEFAULT '', created_by TEXT DEFAULT '', deleted_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
	"CREATE TABLE IF NOT EXISTS vehicle_trips (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_date TEXT NOT NULL, vehicle_no TEXT NOT NULL, driver_name TEXT DEFAULT '', notes TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open', deleted_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
	"CREATE TABLE IF NOT EXISTS trip_expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, expense_type TEXT NOT NULL DEFAULT 'other', amount REAL NOT NULL, notes TEXT DEFAULT '', deleted_at TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
	"CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, action TEXT NOT NULL, changed_by TEXT DEFAULT '', before_json TEXT DEFAULT '', after_json TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
	"CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases (purchase_date)",
	"CREATE INDEX IF NOT EXISTS sales_date_idx ON sales (sale_date)",
	"CREATE INDEX IF NOT EXISTS purchases_farmer_idx ON purchases (farmer_id)",
	"CREATE INDEX IF NOT EXISTS sales_vendor_idx ON sales (vendor_id)",
	"CREATE INDEX IF NOT EXISTS invoices_party_idx ON invoices (party_type, party_id)",
	"CREATE INDEX IF NOT EXISTS cutter_batches_status_idx ON cutter_batches (status)",
	"CREATE INDEX IF NOT EXISTS cutter_batches_date_idx ON cutter_batches (batch_date)",
	"CREATE INDEX IF NOT EXISTS cutter_entries_batch_idx ON cutter_entries (batch_id)",
	"CREATE INDEX IF NOT EXISTS auth_otps_email_idx ON auth_otps (email, expires_at)",
	"CREATE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions (token_hash)",
	"CREATE INDEX IF NOT EXISTS farmer_payments_farmer_idx ON farmer_payments (farmer_id)",
	"CREATE INDEX IF NOT EXISTS trip_expenses_trip_idx ON trip_expenses (trip_id)",
	"CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id)",
	"CREATE INDEX IF NOT EXISTS vehicle_trips_date_idx ON vehicle_trips (trip_date)"
];
var ADDED_COLUMNS = [
	{
		table: "purchases",
		column: "trip_id",
		ddl: "ALTER TABLE purchases ADD COLUMN trip_id INTEGER"
	},
	{
		table: "purchases",
		column: "deleted_at",
		ddl: "ALTER TABLE purchases ADD COLUMN deleted_at TEXT DEFAULT ''"
	},
	{
		table: "sales",
		column: "trip_id",
		ddl: "ALTER TABLE sales ADD COLUMN trip_id INTEGER"
	},
	{
		table: "sales",
		column: "deleted_at",
		ddl: "ALTER TABLE sales ADD COLUMN deleted_at TEXT DEFAULT ''"
	},
	{
		table: "farmers",
		column: "deleted_at",
		ddl: "ALTER TABLE farmers ADD COLUMN deleted_at TEXT DEFAULT ''"
	},
	{
		table: "vendors",
		column: "deleted_at",
		ddl: "ALTER TABLE vendors ADD COLUMN deleted_at TEXT DEFAULT ''"
	},
	{
		table: "vehicles",
		column: "deleted_at",
		ddl: "ALTER TABLE vehicles ADD COLUMN deleted_at TEXT DEFAULT ''"
	}
];
async function ensureColumns(db) {
	for (const { table, column, ddl } of ADDED_COLUMNS) if (!((await db.prepare(`PRAGMA table_info(${table})`).all()).results || []).some((row) => row.name === column)) await db.prepare(ddl).run();
}
async function ensureDb(db) {
	await db.batch(TABLES.map((sql) => db.prepare(sql)));
	await ensureColumns(db);
	const count = await db.prepare("SELECT COUNT(*) AS count FROM farmers").first();
	if (Number(count?.count || 0) === 0) {
		await db.batch([
			db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Kumar Farms", "9876543210", "Pollachi", "North field road"),
			db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Selvi Garden", "9876501234", "Anaimalai", "Canal street"),
			db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Coimbatore Market", "9988776655", "Coimbatore", "Wholesale lane"),
			db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Town Fruit Traders", "8877665544", "Tiruppur", "Market road")
		]);
		const day = today();
		await db.batch(BANANAS.map((banana, idx) => db.prepare("INSERT INTO banana_rates (rate_date, banana_type, buy_rate, sell_rate) VALUES (?, ?, ?, ?)").bind(day, banana, [
			42,
			28,
			36,
			58
		][idx], [
			49,
			34,
			43,
			67
		][idx])));
	}
	const vehicleCount = await db.prepare("SELECT COUNT(*) AS count FROM vehicles").first();
	if (Number(vehicleCount?.count || 0) === 0) await db.batch([db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone) VALUES (?, ?, ?)").bind("TN 38 AB 4421", "Driver 1", ""), db.prepare("INSERT INTO vehicles (vehicle_no, driver_name, phone) VALUES (?, ?, ?)").bind("TN 39 CY 7188", "Driver 2", "")]);
}
//#endregion
//#region worker/stock.ts
async function stockReconciliation(db, fromDate, toDate) {
	const purchased = await all(db, "SELECT banana_type, SUM(weight_kg) AS kg FROM purchases WHERE purchase_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY banana_type", fromDate, toDate);
	const sold = await all(db, "SELECT banana_type, SUM(weight_kg) AS kg FROM sales WHERE sale_date BETWEEN ? AND ? AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY banana_type", fromDate, toDate);
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
//#endregion
//#region worker/trips.ts
async function listTrips(db, month) {
	return all(db, `SELECT t.*,
            COALESCE(p.total, 0) AS purchase_total,
            COALESCE(s.total, 0) AS sale_total,
            COALESCE(x.total, 0) AS expense_total,
            COALESCE(s.total, 0) - COALESCE(p.total, 0) - COALESCE(x.total, 0) AS net_profit
     FROM vehicle_trips t
     LEFT JOIN (SELECT trip_id, SUM(weight_kg * rate) AS total FROM purchases WHERE trip_id IS NOT NULL AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY trip_id) p ON p.trip_id = t.id
     LEFT JOIN (SELECT trip_id, SUM(weight_kg * rate) AS total FROM sales WHERE trip_id IS NOT NULL AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY trip_id) s ON s.trip_id = t.id
     LEFT JOIN (SELECT trip_id, SUM(amount) AS total FROM trip_expenses WHERE deleted_at = '' OR deleted_at IS NULL GROUP BY trip_id) x ON x.trip_id = t.id
     WHERE (t.deleted_at = '' OR t.deleted_at IS NULL) AND t.trip_date LIKE ?
     ORDER BY t.trip_date DESC, t.id DESC`, `${month || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7)}-%`);
}
async function listOpenTrips(db) {
	return all(db, "SELECT id, trip_date, vehicle_no, driver_name FROM vehicle_trips WHERE status = 'open' AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY trip_date DESC, id DESC");
}
async function tripDetail(db, id) {
	return {
		trip: await db.prepare("SELECT * FROM vehicle_trips WHERE id = ?").bind(id).first(),
		purchases: await all(db, "SELECT * FROM purchases WHERE trip_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", id),
		sales: await all(db, "SELECT * FROM sales WHERE trip_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", id),
		expenses: await all(db, "SELECT * FROM trip_expenses WHERE trip_id = ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY id", id)
	};
}
async function createTrip(db, input, changedBy) {
	const result = await db.prepare("INSERT INTO vehicle_trips (trip_date, vehicle_no, driver_name, notes) VALUES (?, ?, ?, ?)").bind(input.trip_date, input.vehicle_no, input.driver_name || "", input.notes || "").run();
	await writeAudit(db, "vehicle_trip", result.meta.last_row_id, "create", changedBy, null, input);
	return result.meta.last_row_id;
}
async function settleTrip(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM vehicle_trips WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE vehicle_trips SET status = 'settled' WHERE id = ?").bind(id).run();
	await writeAudit(db, "vehicle_trip", id, "update", changedBy, before, { status: "settled" });
}
async function deleteTrip(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM vehicle_trips WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE vehicle_trips SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "vehicle_trip", id, "delete", changedBy, before, null);
}
async function addTripExpense(db, input, changedBy) {
	await writeAudit(db, "trip_expense", (await db.prepare("INSERT INTO trip_expenses (trip_id, expense_type, amount, notes) VALUES (?, ?, ?, ?)").bind(Number(input.trip_id), String(input.expense_type || "other"), Number(input.amount), input.notes || "").run()).meta.last_row_id, "create", changedBy, null, input);
}
async function deleteTripExpense(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM trip_expenses WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE trip_expenses SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "trip_expense", id, "delete", changedBy, before, null);
}
//#endregion
//#region worker/state.ts
async function getState(db, url, user) {
	const date = url.searchParams.get("date") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const month = url.searchParams.get("month") || currentMonth();
	const monthLike = `${month}-%`;
	const weekStart = /* @__PURE__ */ new Date(`${date}T00:00:00`);
	weekStart.setDate(weekStart.getDate() - 6);
	const week = weekStart.toISOString().slice(0, 10);
	const [farmers, vendors, vehicles, rates, purchases, sales, invoices, cutterBatches, activityLogs, settingsRows, emailLogs, farmerPayments, trips, openTrips, stock] = await Promise.all([
		listFarmers(db),
		listVendors(db),
		listVehicles(db),
		all(db, "SELECT * FROM banana_rates WHERE rate_date >= ? ORDER BY rate_date DESC, banana_type", week),
		all(db, "SELECT * FROM purchases WHERE purchase_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date DESC, id DESC", monthLike),
		all(db, "SELECT * FROM sales WHERE sale_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY sale_date DESC, id DESC", monthLike),
		all(db, "SELECT * FROM invoices ORDER BY id DESC LIMIT 50"),
		all(db, "SELECT b.*, COUNT(e.id) AS entry_count, COALESCE(SUM(e.gross_weight_kg), 0) AS total_gross_kg, COALESCE(SUM(e.net_weight_kg), 0) AS total_net_kg FROM cutter_batches b LEFT JOIN cutter_entries e ON e.batch_id = b.id WHERE b.batch_date LIKE ? GROUP BY b.id ORDER BY b.id DESC", monthLike),
		all(db, "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 40"),
		all(db, "SELECT * FROM settings"),
		all(db, "SELECT * FROM email_logs ORDER BY id DESC LIMIT 20"),
		listFarmerPayments(db),
		listTrips(db, month),
		listOpenTrips(db),
		stockReconciliation(db, `${month}-01`, `${month}-31`)
	]);
	return {
		date,
		month,
		farmers,
		vendors,
		vehicles,
		rates,
		purchases,
		sales,
		invoices,
		cutterBatches,
		activityLogs,
		settings: Object.fromEntries(settingsRows.map((row) => [row.key, row.value])),
		emailLogs,
		farmerPayments,
		trips,
		openTrips,
		stock,
		staff: user.role === "owner" ? await listStaff(db) : [],
		auditLogs: user.role === "owner" ? await recentAudit(db) : [],
		me: user
	};
}
//#endregion
//#region worker/importExport.ts
async function importRows(db, input, changedBy) {
	const rows = Array.isArray(input.rows) ? input.rows : [];
	let count = 0;
	for (const row of rows) if (input.type === "farmers" && row.name) {
		await createFarmer(db, row, changedBy);
		count++;
	} else if (input.type === "vendors" && row.name) {
		await createVendor(db, row, changedBy);
		count++;
	} else if (input.type === "vehicles" && row.vehicle_no) {
		await createVehicle(db, row, changedBy);
		count++;
	} else if (input.type === "purchases" && row.purchase_date) {
		await writeAudit(db, "purchase", (await db.prepare("INSERT INTO purchases (purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(row.purchase_date, Number(row.farmer_id || 0) || null, row.farmer_name || "", row.banana_type, Number(row.bunches || 0), Number(row.weight_kg), Number(row.rate), row.vehicle_no || "", row.notes || "").run()).meta.last_row_id, "create", changedBy, null, row);
		count++;
	} else if (input.type === "sales" && row.sale_date) {
		await writeAudit(db, "sale", (await db.prepare("INSERT INTO sales (sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(row.sale_date, Number(row.vendor_id || 0) || null, row.vendor_name || "", row.banana_type, Number(row.weight_kg), Number(row.rate), Number(row.paid || 0), row.vehicle_no || "", row.notes || "").run()).meta.last_row_id, "create", changedBy, null, row);
		count++;
	}
	return count;
}
function template(type) {
	const templates = {
		farmers: [
			"name",
			"phone",
			"village",
			"address",
			"gst",
			"notes"
		],
		vendors: [
			"name",
			"phone",
			"market",
			"address",
			"gst",
			"notes"
		],
		vehicles: [
			"vehicle_no",
			"driver_name",
			"phone",
			"notes"
		],
		purchases: [
			"purchase_date",
			"farmer_id",
			"farmer_name",
			"banana_type",
			"bunches",
			"weight_kg",
			"rate",
			"vehicle_no",
			"notes"
		],
		sales: [
			"sale_date",
			"vendor_id",
			"vendor_name",
			"banana_type",
			"weight_kg",
			"rate",
			"paid",
			"vehicle_no",
			"notes"
		]
	};
	return templates[type] || templates.farmers;
}
async function exportData(db, type, month) {
	if (type === "farmers") return toCsv(template(type), await all(db, "SELECT name, phone, village, address, gst, notes FROM farmers WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name"));
	if (type === "vendors") return toCsv(template(type), await all(db, "SELECT name, phone, market, address, gst, notes FROM vendors WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name"));
	if (type === "vehicles") return toCsv(template(type), await all(db, "SELECT vehicle_no, driver_name, phone, notes FROM vehicles WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY vehicle_no"));
	if (type === "sales") return toCsv(template(type), await all(db, "SELECT sale_date, vendor_id, vendor_name, banana_type, weight_kg, rate, paid, vehicle_no, notes FROM sales WHERE sale_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY sale_date, id", `${month}-%`));
	return toCsv(template("purchases"), await all(db, "SELECT purchase_date, farmer_id, farmer_name, banana_type, bunches, weight_kg, rate, vehicle_no, notes FROM purchases WHERE purchase_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY purchase_date, id", `${month}-%`));
}
//#endregion
//#region worker/index.ts
async function handleApi(request, env, url) {
	const db = env.DB;
	if (!db) return json({ error: "D1 database binding is missing." }, 500);
	await ensureDb(db);
	const input = request.method === "POST" ? await bodyJson(request) : {};
	if (url.pathname === "/api/auth/me") {
		const user = await currentUser(db, request);
		return json({
			authenticated: Boolean(user),
			user
		});
	}
	if (url.pathname === "/api/auth/request") return requestOtp(db, env, input);
	if (url.pathname === "/api/auth/verify") return verifyOtp(db, input);
	if (url.pathname === "/api/auth/logout") return logout(db, request);
	const user = await currentUser(db, request);
	if (!user) return json({ error: "Login required" }, 401);
	const by = user.email;
	if (url.pathname === "/api/state") return json(await getState(db, url, user));
	if (url.pathname === "/api/farmers") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createFarmer(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/farmers/update") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await updateFarmer(db, Number(input.id), input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/farmers/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteFarmer(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/vendors") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createVendor(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/vendors/update") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await updateVendor(db, Number(input.id), input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/vendors/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteVendor(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/vehicles") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createVehicle(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/vehicles/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteVehicle(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/rates") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createRate(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/purchases") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createPurchase(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/purchases/update") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await updatePurchase(db, Number(input.id), input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/purchases/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deletePurchase(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/sales") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createSale(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/sales/update") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await updateSale(db, Number(input.id), input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/sales/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteSale(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/cutter/submit") return json({ id: await submitCutterBatch(db, input, by) });
	if (url.pathname === "/api/cutter/approve") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ id: await approveCutterBatch(db, input, by) });
	}
	if (url.pathname === "/api/cutter/reject") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await rejectCutterBatch(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/farmer-payments") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createFarmerPayment(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/farmer-payments/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteFarmerPayment(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/farmer-ledger") return json(await farmerLedger(db, Number(url.searchParams.get("farmer_id") || 0)));
	if (url.pathname === "/api/trips") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ id: await createTrip(db, input, by) });
	}
	if (url.pathname === "/api/trips/settle") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await settleTrip(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/trips/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteTrip(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/trip-detail") return json(await tripDetail(db, Number(url.searchParams.get("id") || 0)));
	if (url.pathname === "/api/trip-expenses") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await addTripExpense(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/trip-expenses/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteTripExpense(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/staff") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		await createStaff(db, input);
		return json({
			ok: true,
			staff: await listStaff(db)
		});
	}
	if (url.pathname === "/api/staff/toggle") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		await setStaffActive(db, Number(input.id), Boolean(input.active));
		return json({ ok: true });
	}
	if (url.pathname === "/api/import") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ count: await importRows(db, input, by) });
	}
	if (url.pathname === "/api/template") {
		const type = url.searchParams.get("type") || "farmers";
		return csv(template(type).join(",") + "\n", `${type}-template.csv`);
	}
	if (url.pathname === "/api/export") {
		const type = url.searchParams.get("type") || "purchases";
		const month = url.searchParams.get("month") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
		return csv(await exportData(db, type, month), `${type}-${month}.csv`);
	}
	if (url.pathname === "/api/invoices/generate") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ id: await generateInvoice(db, input, by) });
	}
	if (url.pathname === "/api/invoices/void") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		await voidInvoice(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/settings") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("daily_email_recipients", input.daily_email_recipients || "").run();
		await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("daily_email_time", input.daily_email_time || "19:00").run();
		return json({ ok: true });
	}
	if (url.pathname === "/api/email/send-daily") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json(await sendDailyEmail(db, env, String(input.report_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10))));
	}
	if (url.pathname === "/api/reports/daily-text") return json({ text: await dailyReport(db, url.searchParams.get("date") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) });
	return json({ error: "Not found" }, 404);
}
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/logo.png" && env.ASSETS) return env.ASSETS.fetch(request);
		if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
		if (url.pathname.startsWith("/invoice/")) {
			if (!env.DB) return html("D1 database binding is missing.", 500);
			await ensureDb(env.DB);
			if (!await currentUser(env.DB, request)) return html("<!doctype html><html><head><meta charset=\"utf-8\"><title>Login required</title></head><body><p>Login required. Open the KMS Banana Desk and verify your email OTP before printing invoices.</p></body></html>", 401);
			return invoiceHtml(env.DB, url.pathname.split("/").pop(), env);
		}
		return html(appShell());
	},
	async scheduled(_event, env) {
		if (!env.DB) return;
		await ensureDb(env.DB);
		await sendDailyEmail(env.DB, env, (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	}
};
//#endregion
export { worker_entry_default as default };
