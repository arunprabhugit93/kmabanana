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
function netWeight(grossWeightKg, units, stemReductionPerUnit) {
	return Math.max(0, Number(grossWeightKg || 0) - Number(units || 0) * Number(stemReductionPerUnit || 0));
}
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
	const role = ["owner", "staff"].includes(String(input.role)) ? String(input.role) : "staff";
	if (!email) throw new Error("Email is required");
	await db.prepare("INSERT INTO staff_users (email, name, role, active) VALUES (?, ?, ?, 1) ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, active = 1").bind(email, String(input.name || ""), role).run();
}
async function setStaffActive(db, id, active) {
	await db.prepare("UPDATE staff_users SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
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
//#region worker/masters.ts
async function listFarmers(db) {
	return all(db, `SELECT f.*, COALESCE(pi.pending, 0) AS pending
     FROM farmers f
     LEFT JOIN (SELECT farmer_id, SUM(pending) AS pending FROM purchase_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY farmer_id) pi ON pi.farmer_id = f.id
     WHERE f.deleted_at = '' OR f.deleted_at IS NULL
     ORDER BY f.name`);
}
async function listVendors(db) {
	return all(db, `SELECT v.*, COALESCE(si.pending, 0) AS pending
     FROM vendors v
     LEFT JOIN (SELECT vendor_id, SUM(pending) AS pending FROM sale_invoices WHERE status != 'void' AND (deleted_at = '' OR deleted_at IS NULL) GROUP BY vendor_id) si ON si.vendor_id = v.id
     WHERE v.deleted_at = '' OR v.deleted_at IS NULL
     ORDER BY v.name`);
}
async function listVehicles(db) {
	return all(db, "SELECT * FROM vehicles WHERE (deleted_at = '' OR deleted_at IS NULL) AND active = 1 ORDER BY vehicle_no");
}
async function listBananaTypes(db) {
	return all(db, "SELECT * FROM banana_types WHERE active = 1 ORDER BY name");
}
async function createBananaType(db, input, changedBy) {
	await db.prepare("INSERT INTO banana_types (name, active) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET active = 1").bind(String(input.name || "").trim()).run();
	await writeAudit(db, "banana_type", 0, "create", changedBy, null, input);
}
async function deleteBananaType(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM banana_types WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE banana_types SET active = 0 WHERE id = ?").bind(id).run();
	await writeAudit(db, "banana_type", id, "delete", changedBy, before, null);
}
async function createFarmer(db, input, changedBy) {
	await writeAudit(db, "farmer", (await db.prepare("INSERT INTO farmers (name, phone, village, address, gst, email, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.email || "", input.notes || "").run()).meta.last_row_id, "create", changedBy, null, input);
}
async function updateFarmer(db, id, input, changedBy) {
	const before = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE farmers SET name = ?, phone = ?, village = ?, address = ?, gst = ?, email = ?, notes = ? WHERE id = ?").bind(input.name, input.phone || "", input.village || "", input.address || "", input.gst || "", input.email || "", input.notes || "", id).run();
	await writeAudit(db, "farmer", id, "update", changedBy, before, input);
}
async function deleteFarmer(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM farmers WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE farmers SET deleted_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id).run();
	await writeAudit(db, "farmer", id, "delete", changedBy, before, null);
}
async function createVendor(db, input, changedBy) {
	await writeAudit(db, "vendor", (await db.prepare("INSERT INTO vendors (name, phone, market, address, gst, email, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.email || "", input.notes || "").run()).meta.last_row_id, "create", changedBy, null, input);
}
async function updateVendor(db, id, input, changedBy) {
	const before = await db.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE vendors SET name = ?, phone = ?, market = ?, address = ?, gst = ?, email = ?, notes = ? WHERE id = ?").bind(input.name, input.phone || "", input.market || "", input.address || "", input.gst || "", input.email || "", input.notes || "", id).run();
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
	const grade = String(input.grade || "1st grade");
	const before = await db.prepare("SELECT * FROM banana_rates WHERE rate_date = ? AND banana_type = ? AND grade = ?").bind(input.rate_date, input.banana_type, grade).first();
	await db.prepare("INSERT INTO banana_rates (rate_date, banana_type, grade, buy_rate, sell_rate) VALUES (?, ?, ?, ?, ?) ON CONFLICT(rate_date, banana_type, grade) DO UPDATE SET buy_rate = excluded.buy_rate, sell_rate = excluded.sell_rate").bind(input.rate_date, input.banana_type, grade, Number(input.buy_rate), Number(input.sell_rate)).run();
	await writeAudit(db, "banana_rate", 0, before ? "update" : "create", changedBy, before, input);
}
//#endregion
//#region worker/whatsapp.ts
async function sendWhatsAppTemplate(env, toPhone, templateName, bodyParams) {
	if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return {
		sent: false,
		message: "WhatsApp is not configured."
	};
	const to = toPhone.replace(/[^\d+]/g, "");
	if (!to) return {
		sent: false,
		message: "No WhatsApp number on file."
	};
	const response = await fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({
			messaging_product: "whatsapp",
			to,
			type: "template",
			template: {
				name: templateName,
				language: { code: "en" },
				components: [{
					type: "body",
					parameters: bodyParams.map((text) => ({
						type: "text",
						text
					}))
				}]
			}
		})
	});
	const message = response.ok ? "Sent" : await response.text();
	return {
		sent: response.ok,
		message
	};
}
//#endregion
//#region worker/invoiceBranding.ts
var DEFAULTS = {
	name: "KMS Banana",
	address: "Chikkahole Checkpost, Chamarajnagar, Kongahalli Main Road, Thalavadi",
	proprietor1Name: "Prasanth K",
	proprietor1Phone: "94423 35317, 86680 77002",
	proprietor2Name: "Boopathi M",
	proprietor2Phone: "94881 33923, 63806 01633"
};
var BUSINESS_SETTING_KEYS = [
	"business_name",
	"business_address",
	"proprietor1_name",
	"proprietor1_phone",
	"proprietor2_name",
	"proprietor2_phone"
];
async function getBusinessDetails(db) {
	const result = await db.prepare("SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?, ?, ?)").bind(...BUSINESS_SETTING_KEYS).all();
	const map = Object.fromEntries((result.results || []).map((row) => [row.key, row.value]));
	return {
		name: map.business_name || DEFAULTS.name,
		address: map.business_address || DEFAULTS.address,
		proprietor1Name: map.proprietor1_name || DEFAULTS.proprietor1Name,
		proprietor1Phone: map.proprietor1_phone || DEFAULTS.proprietor1Phone,
		proprietor2Name: map.proprietor2_name || DEFAULTS.proprietor2Name,
		proprietor2Phone: map.proprietor2_phone || DEFAULTS.proprietor2Phone
	};
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
var ONES = [
	"",
	"One",
	"Two",
	"Three",
	"Four",
	"Five",
	"Six",
	"Seven",
	"Eight",
	"Nine",
	"Ten",
	"Eleven",
	"Twelve",
	"Thirteen",
	"Fourteen",
	"Fifteen",
	"Sixteen",
	"Seventeen",
	"Eighteen",
	"Nineteen"
];
var TENS = [
	"",
	"",
	"Twenty",
	"Thirty",
	"Forty",
	"Fifty",
	"Sixty",
	"Seventy",
	"Eighty",
	"Ninety"
];
function twoDigitWords(n) {
	if (n < 20) return ONES[n];
	return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigitWords(n) {
	if (n < 100) return twoDigitWords(n);
	return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigitWords(n % 100) : "");
}
function amountInWords(amount) {
	let n = Math.round(Math.abs(amount));
	if (n === 0) return "Zero Rupees Only";
	const crore = Math.floor(n / 1e7);
	n %= 1e7;
	const lakh = Math.floor(n / 1e5);
	n %= 1e5;
	const thousand = Math.floor(n / 1e3);
	n %= 1e3;
	const rest = n;
	const parts = [];
	if (crore) parts.push(threeDigitWords(crore) + " Crore");
	if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
	if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
	if (rest) parts.push(threeDigitWords(rest));
	return parts.join(" ") + " Rupees Only";
}
function invoiceHeaderHtml(business, logoSrc) {
	return `<section class="letterhead">
    <div class="prop"><strong>${e(business.proprietor1Name)}</strong><span>${e(business.proprietor1Phone)}</span></div>
    <div class="brandblock">
      <img src="${logoSrc}" alt="${e(business.name)} logo">
      <h1>${e(business.name)}</h1>
      <p>${e(business.address)}</p>
    </div>
    <div class="prop right"><strong>${e(business.proprietor2Name)}</strong><span>${e(business.proprietor2Phone)}</span></div>
  </section>`;
}
function partyBoxHtml(label, name, phone, locationLabel, location, address, email, gst) {
	const lines = [
		phone ? `Phone: ${e(phone)}` : "",
		location ? `${locationLabel}: ${e(location)}` : "",
		address || "",
		email ? `Email: ${e(email)}` : "",
		gst ? `GST: ${e(gst)}` : ""
	].filter(Boolean).join("<br>");
	return `<div class="box"><div class="label">${e(label)}</div><div class="value">${e(name)}</div>${lines ? `<p class="muted" style="margin-top:6px;line-height:1.5">${lines}</p>` : ""}</div>`;
}
function signatureBlockHtml(businessName) {
	return `<div class="signature"><p>For ${e(businessName)}</p><div class="sigline"></div><span class="muted">Authorised signatory</span></div>`;
}
var INVOICE_STYLE = `*{box-sizing:border-box}body{background:radial-gradient(circle at 85% 6%,rgba(255,205,49,.24),transparent 260px),#f4f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;margin:0;padding:28px}
.sheet{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,255,255,.94)),radial-gradient(circle at 90% 12%,rgba(255,209,58,.22),transparent 280px);border:1px solid #dce3d8;margin:auto;max-width:980px;overflow:hidden;padding:34px;position:relative}
.sheet:after{color:rgba(217,173,58,.07);content:"KMS BANANA";font-size:5rem;font-weight:900;position:absolute;right:-20px;top:44%;transform:rotate(-18deg);z-index:0}
.sheet>*{position:relative;z-index:1}
.actions{margin:0 auto 16px;max-width:980px}
button{background:#2f6b43;border:0;border-radius:7px;color:#fff;font-weight:700;padding:10px 14px}
.letterhead{align-items:center;border-bottom:4px double #2f6b43;display:grid;gap:14px;grid-template-columns:1fr auto 1fr;padding-bottom:18px;text-align:center}
.prop{color:#3a463e;display:grid;font-size:.86rem;gap:3px;justify-items:center}
.prop.right{justify-items:center}
.prop strong{font-size:.95rem}
.brandblock{display:grid;gap:6px;justify-items:center}
.brandblock img{height:78px;object-fit:contain;width:150px}
.brandblock h1{font-size:2.1rem;font-weight:900;letter-spacing:.5px}
.brandblock p{color:#66736a;font-size:.82rem;max-width:420px}
.billmeta{display:flex;flex-wrap:wrap;font-size:.86rem;gap:10px 28px;justify-content:space-between;margin:16px 0}
.billmeta strong{color:#184c2c}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}
.box{border:1px solid #dce3d8;border-radius:8px;padding:14px}
.label{color:#66736a;font-size:.72rem;font-weight:800;text-transform:uppercase}
.value{font-size:1.05rem;font-weight:800;margin-top:5px}
table{border-collapse:collapse;width:100%}
td,th{border-bottom:1px solid #e8ede4;padding:11px 9px;text-align:left}
th{background:#f6f8f4;color:#66736a;font-size:.72rem;text-transform:uppercase}
.num{text-align:right}
.totals{margin-left:auto;margin-top:20px;width:340px}
.totals td,.totals th{border:1px solid #dce3d8}
.totals .due{background:#fff7df;font-size:1.08rem}
.words{color:#3a463e;font-size:.88rem;font-style:italic;margin-top:10px}
.footer-row{align-items:end;display:flex;gap:20px;justify-content:space-between;margin-top:44px}
.signature{display:grid;gap:6px;justify-items:end;text-align:right}
.signature p{font-weight:800}
.sigline{border-top:1px solid #17211b;margin-top:38px;width:200px}
.footer{border-top:1px solid #dce3d8;color:#66736a;font-size:.8rem;line-height:1.5;margin-top:26px;padding-top:14px}
.badge{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:#184c2c;display:inline-block;font-size:.78rem;font-weight:800;margin-top:8px;padding:5px 10px;text-transform:uppercase}
.muted{color:#66736a}
@media print{body{background:#fff;padding:0}.actions{display:none}.sheet{border:0;max-width:none;padding:20px}}`;
//#endregion
//#region worker/purchaseInvoices.ts
async function listPurchaseInvoices(db, month) {
	return all(db, "SELECT * FROM purchase_invoices WHERE invoice_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY invoice_date DESC, id DESC", `${month || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7)}-%`);
}
async function purchaseInvoiceDetail(db, id) {
	return {
		invoice: await db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").bind(id).first(),
		items: await all(db, "SELECT * FROM purchase_invoice_items WHERE invoice_id = ? ORDER BY id", id)
	};
}
async function createPurchaseInvoice(db, input, changedBy) {
	const items = Array.isArray(input.items) ? input.items : [];
	if (!items.length) throw new Error("Add at least one line item before saving the invoice.");
	const farmer = await db.prepare("SELECT name FROM farmers WHERE id = ?").bind(Number(input.farmer_id)).first();
	if (!farmer) throw new Error("Select a valid farmer.");
	const computed = items.map((item) => {
		const netWeightKg = netWeight(item.gross_weight_kg, item.units, item.stem_reduction_per_unit);
		const amount = netWeightKg * Number(item.rate);
		return {
			...item,
			netWeightKg,
			amount
		};
	});
	const total = computed.reduce((sum, item) => sum + item.amount, 0);
	const paid = Number(input.paid || 0);
	const pending = total - paid;
	const invoiceNo = `PINV-${Date.now()}`;
	const invoiceDate = String(input.invoice_date);
	const invoiceId = (await db.prepare("INSERT INTO purchase_invoices (invoice_no, invoice_date, farmer_id, farmer_name, total, paid, pending, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceNo, invoiceDate, Number(input.farmer_id), farmer.name, total, paid, pending, pending > 0 ? "open" : "paid", input.notes || "", changedBy).run()).meta.last_row_id;
	for (const item of computed) await db.prepare("INSERT INTO purchase_invoice_items (invoice_id, banana_type, grade, units, gross_weight_kg, stem_reduction_per_unit, net_weight_kg, rate, amount, vehicle_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceId, item.banana_type, item.grade, Number(item.units), Number(item.gross_weight_kg), Number(item.stem_reduction_per_unit || 0), item.netWeightKg, Number(item.rate), item.amount, item.vehicle_no || "", item.notes || "").run();
	await writeAudit(db, "purchase_invoice", invoiceId, "create", changedBy, null, {
		invoice_no: invoiceNo,
		farmer_id: input.farmer_id,
		total,
		paid,
		items: computed.length
	});
	return invoiceId;
}
async function updatePurchaseInvoicePaid(db, id, paid, changedBy) {
	const before = await db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").bind(id).first();
	if (!before) throw new Error("Invoice not found.");
	const pending = before.total - paid;
	await db.prepare("UPDATE purchase_invoices SET paid = ?, pending = ?, status = ? WHERE id = ?").bind(paid, pending, pending > 0 ? "open" : "paid", id).run();
	await writeAudit(db, "purchase_invoice", id, "update", changedBy, before, {
		paid,
		pending
	});
}
async function voidPurchaseInvoice(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE purchase_invoices SET status = 'void' WHERE id = ?").bind(id).run();
	await writeAudit(db, "purchase_invoice", id, "void", changedBy, before, { status: "void" });
}
async function purchaseInvoiceHtml(db, id, env) {
	const { invoice, items } = await purchaseInvoiceDetail(db, Number(id));
	if (!invoice) return html("Invoice not found", 404);
	const farmer = await db.prepare("SELECT phone, village, address, email, gst FROM farmers WHERE id = ?").bind(invoice.farmer_id).first();
	const business = await getBusinessDetails(db);
	const logoSrc = await logoDataUrl(env);
	const rows = items.map((item) => `<tr><td>${e(item.banana_type)} (${e(item.grade)})</td><td class="num">${e(item.units)}</td><td class="num">${e(item.gross_weight_kg)}</td><td class="num">${e(item.stem_reduction_per_unit)}</td><td class="num">${e(item.net_weight_kg)}</td><td class="num">${money(item.rate)}</td><td>${e(item.vehicle_no)}</td><td class="num">${money(item.amount)}</td></tr>`).join("");
	const voidBadge = invoice.status === "void" ? "<span class=\"badge\" style=\"background:#fff0ee;border-color:#edc4bf;color:#b3463c\">VOID</span>" : `<span class="badge">${e(invoice.status)}</span>`;
	const vehicles = Array.from(new Set(items.map((it) => it.vehicle_no).filter(Boolean)));
	return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>${INVOICE_STYLE}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet">
${invoiceHeaderHtml(business, logoSrc)}
<div class="billmeta"><span><strong>Purchase Invoice</strong> ${e(invoice.invoice_no)}</span><span>Date: <strong>${e(invoice.invoice_date)}</strong></span><span>Vehicle(s): <strong>${e(vehicles.join(", ") || "-")}</strong></span><span>${voidBadge}</span></div>
<section class="meta">
${partyBoxHtml("Farmer (Seller)", invoice.farmer_name, farmer?.phone || "", "Village", farmer?.village || "", farmer?.address || "", farmer?.email || "", farmer?.gst || "")}
<div class="box"><div class="label">Notes</div><div class="value" style="font-size:.9rem;font-weight:600">${e(invoice.notes || "-")}</div></div>
</section>
<table><thead><tr><th>Banana (grade)</th><th class="num">Units</th><th class="num">Gross kg</th><th class="num">Stem/unit</th><th class="num">Net kg</th><th class="num">Rate</th><th>Vehicle</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table>
<p class="words">${amountInWords(invoice.total)}</p>
<div class="footer-row">${signatureBlockHtml(business.name)}</div>
<p class="footer">Generated from ${e(business.name)} Desk.</p>
</main></body></html>`);
}
function purchaseInvoiceText(businessName, invoice, items) {
	return [
		`${businessName} - Purchase Invoice ${invoice.invoice_no}`,
		`Farmer: ${invoice.farmer_name}`,
		`Date: ${invoice.invoice_date}`,
		"",
		...items.map((item) => `${item.banana_type} (${item.grade}) | ${item.net_weight_kg} kg @ ${money(item.rate)} = ${money(item.amount)} | ${item.vehicle_no}`),
		"",
		`Total: ${money(invoice.total)}`,
		`Paid: ${money(invoice.paid)}`,
		`Pending: ${money(invoice.pending)}`
	].join("\n");
}
async function sendPurchaseInvoice(db, env, id, origin) {
	const { invoice, items } = await purchaseInvoiceDetail(db, id);
	if (!invoice) throw new Error("Invoice not found.");
	const farmer = await db.prepare("SELECT email, phone FROM farmers WHERE id = ?").bind(invoice.farmer_id).first();
	const text = purchaseInvoiceText((await getBusinessDetails(db)).name, invoice, items);
	const link = `${origin}/purchase-invoice/${invoice.id}`;
	const results = {};
	if (farmer?.email) results.email = await sendEmail(env, [farmer.email], `Purchase invoice ${invoice.invoice_no}`, `${text}\n\nView/print: ${link}`);
	if (farmer?.phone) results.whatsapp = await sendWhatsAppTemplate(env, farmer.phone, "purchase_invoice_notice", [
		invoice.invoice_no,
		invoice.farmer_name,
		money(invoice.total),
		money(invoice.pending),
		link
	]);
	return results;
}
//#endregion
//#region worker/saleInvoices.ts
async function listSaleInvoices(db, month) {
	return all(db, "SELECT * FROM sale_invoices WHERE invoice_date LIKE ? AND (deleted_at = '' OR deleted_at IS NULL) ORDER BY invoice_date DESC, id DESC", `${month || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7)}-%`);
}
async function saleInvoiceDetail(db, id) {
	return {
		invoice: await db.prepare("SELECT * FROM sale_invoices WHERE id = ?").bind(id).first(),
		items: await all(db, "SELECT * FROM sale_invoice_items WHERE invoice_id = ? ORDER BY id", id)
	};
}
async function vehicleLoadAvailable(db, vehicleNo, date) {
	const purchased = await all(db, `SELECT pi.banana_type, pi.grade, SUM(pi.net_weight_kg) AS kg
     FROM purchase_invoice_items pi
     JOIN purchase_invoices p ON p.id = pi.invoice_id
     WHERE pi.vehicle_no = ? AND p.invoice_date = ? AND p.status != 'void' AND (p.deleted_at = '' OR p.deleted_at IS NULL)
     GROUP BY pi.banana_type, pi.grade`, vehicleNo, date);
	const sold = await all(db, `SELECT si.banana_type, si.grade, SUM(si.net_weight_kg) AS kg
     FROM sale_invoice_items si
     JOIN sale_invoices s ON s.id = si.invoice_id
     WHERE s.vehicle_no = ? AND s.invoice_date = ? AND s.status != 'void' AND (s.deleted_at = '' OR s.deleted_at IS NULL)
     GROUP BY si.banana_type, si.grade`, vehicleNo, date);
	const soldMap = new Map(sold.map((row) => [`${row.banana_type}|${row.grade}`, Number(row.kg)]));
	return purchased.map((row) => {
		const key = `${row.banana_type}|${row.grade}`;
		const purchasedKg = Number(row.kg);
		const soldKg = soldMap.get(key) || 0;
		return {
			banana_type: row.banana_type,
			grade: row.grade,
			purchased_kg: purchasedKg,
			sold_kg: soldKg,
			available_kg: Math.max(0, purchasedKg - soldKg)
		};
	});
}
async function createSaleInvoice(db, input, changedBy) {
	const items = Array.isArray(input.items) ? input.items : [];
	if (!items.length) throw new Error("Add at least one line item before saving the invoice.");
	const vendor = await db.prepare("SELECT name FROM vendors WHERE id = ?").bind(Number(input.vendor_id)).first();
	if (!vendor) throw new Error("Select a valid buyer.");
	const computed = items.map((item) => ({
		...item,
		amount: Number(item.net_weight_kg) * Number(item.rate)
	}));
	const total = computed.reduce((sum, item) => sum + item.amount, 0);
	const paid = Number(input.paid || 0);
	const pending = total - paid;
	const invoiceNo = `SINV-${Date.now()}`;
	const invoiceDate = String(input.invoice_date);
	const invoiceId = (await db.prepare("INSERT INTO sale_invoices (invoice_no, invoice_date, vendor_id, vendor_name, vehicle_no, total, paid, pending, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(invoiceNo, invoiceDate, Number(input.vendor_id), vendor.name, input.vehicle_no || "", total, paid, pending, pending > 0 ? "open" : "paid", input.notes || "", changedBy).run()).meta.last_row_id;
	for (const item of computed) await db.prepare("INSERT INTO sale_invoice_items (invoice_id, banana_type, grade, net_weight_kg, rate, amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(invoiceId, item.banana_type, item.grade, Number(item.net_weight_kg), Number(item.rate), item.amount, item.notes || "").run();
	await writeAudit(db, "sale_invoice", invoiceId, "create", changedBy, null, {
		invoice_no: invoiceNo,
		vendor_id: input.vendor_id,
		total,
		paid,
		items: computed.length
	});
	return invoiceId;
}
async function updateSaleInvoicePaid(db, id, paid, changedBy) {
	const before = await db.prepare("SELECT * FROM sale_invoices WHERE id = ?").bind(id).first();
	if (!before) throw new Error("Invoice not found.");
	const pending = before.total - paid;
	await db.prepare("UPDATE sale_invoices SET paid = ?, pending = ?, status = ? WHERE id = ?").bind(paid, pending, pending > 0 ? "open" : "paid", id).run();
	await writeAudit(db, "sale_invoice", id, "update", changedBy, before, {
		paid,
		pending
	});
}
async function voidSaleInvoice(db, id, changedBy) {
	const before = await db.prepare("SELECT * FROM sale_invoices WHERE id = ?").bind(id).first();
	await db.prepare("UPDATE sale_invoices SET status = 'void' WHERE id = ?").bind(id).run();
	await writeAudit(db, "sale_invoice", id, "void", changedBy, before, { status: "void" });
}
async function saleInvoiceHtml(db, id, env) {
	const { invoice, items } = await saleInvoiceDetail(db, Number(id));
	if (!invoice) return html("Invoice not found", 404);
	const vendor = await db.prepare("SELECT phone, market, address, email, gst FROM vendors WHERE id = ?").bind(invoice.vendor_id).first();
	const business = await getBusinessDetails(db);
	const logoSrc = await logoDataUrl(env);
	const rows = items.map((item) => `<tr><td>${e(item.banana_type)} (${e(item.grade)})</td><td class="num">${e(item.net_weight_kg)}</td><td class="num">${money(item.rate)}</td><td class="num">${money(item.amount)}</td></tr>`).join("");
	const voidBadge = invoice.status === "void" ? "<span class=\"badge\" style=\"background:#fff0ee;border-color:#edc4bf;color:#b3463c\">VOID</span>" : `<span class="badge">${e(invoice.status)}</span>`;
	return html(`<!doctype html><html><head><meta charset="utf-8"><title>${e(invoice.invoice_no)}</title><style>${INVOICE_STYLE}</style></head><body><div class="actions"><button onclick="print()">Print invoice</button></div><main class="sheet">
${invoiceHeaderHtml(business, logoSrc)}
<div class="billmeta"><span><strong>Sales Invoice</strong> ${e(invoice.invoice_no)}</span><span>Date: <strong>${e(invoice.invoice_date)}</strong></span><span>Vehicle: <strong>${e(invoice.vehicle_no || "-")}</strong></span><span>${voidBadge}</span></div>
<section class="meta">
${partyBoxHtml("Buyer", invoice.vendor_name, vendor?.phone || "", "Market", vendor?.market || "", vendor?.address || "", vendor?.email || "", vendor?.gst || "")}
<div class="box"><div class="label">Notes</div><div class="value" style="font-size:.9rem;font-weight:600">${e(invoice.notes || "-")}</div></div>
</section>
<table><thead><tr><th>Banana (grade)</th><th class="num">Net kg</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tr><th>Total</th><td class="num">${money(invoice.total)}</td></tr><tr><th>Paid</th><td class="num">${money(invoice.paid)}</td></tr><tr class="due"><th>Pending</th><td class="num">${money(invoice.pending)}</td></tr></table>
<p class="words">${amountInWords(invoice.total)}</p>
<div class="footer-row">${signatureBlockHtml(business.name)}</div>
<p class="footer">Generated from ${e(business.name)} Desk.</p>
</main></body></html>`);
}
function saleInvoiceText(businessName, invoice, items) {
	return [
		`${businessName} - Sales Invoice ${invoice.invoice_no}`,
		`Buyer: ${invoice.vendor_name}`,
		`Date: ${invoice.invoice_date}`,
		`Vehicle: ${invoice.vehicle_no}`,
		"",
		...items.map((item) => `${item.banana_type} (${item.grade}) | ${item.net_weight_kg} kg @ ${money(item.rate)} = ${money(item.amount)}`),
		"",
		`Total: ${money(invoice.total)}`,
		`Paid: ${money(invoice.paid)}`,
		`Pending: ${money(invoice.pending)}`
	].join("\n");
}
async function sendSaleInvoice(db, env, id, origin) {
	const { invoice, items } = await saleInvoiceDetail(db, id);
	if (!invoice) throw new Error("Invoice not found.");
	const vendor = await db.prepare("SELECT email, phone FROM vendors WHERE id = ?").bind(invoice.vendor_id).first();
	const text = saleInvoiceText((await getBusinessDetails(db)).name, invoice, items);
	const link = `${origin}/sale-invoice/${invoice.id}`;
	const results = {};
	if (vendor?.email) results.email = await sendEmail(env, [vendor.email], `Sales invoice ${invoice.invoice_no}`, `${text}\n\nView/print: ${link}`);
	if (vendor?.phone) results.whatsapp = await sendWhatsAppTemplate(env, vendor.phone, "sale_invoice_notice", [
		invoice.invoice_no,
		invoice.vendor_name,
		money(invoice.total),
		money(invoice.pending),
		link
	]);
	return results;
}
//#endregion
//#region worker/reports.ts
async function periodReport(db, fromDate, toDate) {
	const buys = await all(db, `SELECT pi.banana_type, pi.grade, SUM(pi.net_weight_kg) AS kg, SUM(pi.amount) AS value
     FROM purchase_invoice_items pi JOIN purchase_invoices p ON p.id = pi.invoice_id
     WHERE p.invoice_date BETWEEN ? AND ? AND p.status != 'void' AND (p.deleted_at = '' OR p.deleted_at IS NULL)
     GROUP BY pi.banana_type, pi.grade`, fromDate, toDate);
	const sells = await all(db, `SELECT si.banana_type, si.grade, SUM(si.net_weight_kg) AS kg, SUM(si.amount) AS value
     FROM sale_invoice_items si JOIN sale_invoices s ON s.id = si.invoice_id
     WHERE s.invoice_date BETWEEN ? AND ? AND s.status != 'void' AND (s.deleted_at = '' OR s.deleted_at IS NULL)
     GROUP BY si.banana_type, si.grade`, fromDate, toDate);
	const key = (b, g) => `${b}|${g}`;
	const rows = /* @__PURE__ */ new Map();
	for (const b of buys) rows.set(key(b.banana_type, b.grade), {
		banana_type: b.banana_type,
		grade: b.grade,
		buy_kg: Number(b.kg),
		buy_value: Number(b.value),
		sell_kg: 0,
		sell_value: 0,
		margin: 0
	});
	for (const s of sells) {
		const k = key(s.banana_type, s.grade);
		const row = rows.get(k) || {
			banana_type: s.banana_type,
			grade: s.grade,
			buy_kg: 0,
			buy_value: 0,
			sell_kg: 0,
			sell_value: 0,
			margin: 0
		};
		row.sell_kg = Number(s.kg);
		row.sell_value = Number(s.value);
		rows.set(k, row);
	}
	return Array.from(rows.values()).map((row) => ({
		...row,
		margin: row.sell_value - row.buy_value
	})).sort((a, b) => a.banana_type.localeCompare(b.banana_type) || a.grade.localeCompare(b.grade));
}
function reportText(period, fromDate, toDate, rows) {
	const totalBuy = rows.reduce((sum, r) => sum + r.buy_value, 0);
	const totalSell = rows.reduce((sum, r) => sum + r.sell_value, 0);
	return [
		`KMS Banana ${period} report - ${fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`}`,
		`Total buy value: ${money(totalBuy)}`,
		`Total sell value: ${money(totalSell)}`,
		`Total margin: ${money(totalSell - totalBuy)}`,
		"",
		"By banana type and grade:",
		...rows.map((r) => `${r.banana_type} (${r.grade}) | buy ${r.buy_kg} kg / ${money(r.buy_value)} | sell ${r.sell_kg} kg / ${money(r.sell_value)} | margin ${money(r.margin)}`)
	].join("\n");
}
async function getSetting(db, key) {
	return (await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first())?.value || "";
}
async function sendPeriodReport(db, env, period, fromDate, toDate) {
	const rows = await periodReport(db, fromDate, toDate);
	const body = reportText(period, fromDate, toDate, rows);
	const subject = `KMS Banana ${period} report (${fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`})`;
	const recipients = (await getSetting(db, period.toLowerCase() === "daily" ? "daily_email_recipients" : period.toLowerCase() === "weekly" ? "weekly_email_recipients" : "monthly_email_recipients")).split(",").map((x) => x.trim()).filter(Boolean);
	const whatsappNumbers = (await getSetting(db, "whatsapp_numbers")).split(",").map((x) => x.trim()).filter(Boolean);
	let status = "draft";
	let message = "No recipients configured. Report was saved as a draft log.";
	if (recipients.length) {
		const delivery = await sendEmail(env, recipients, subject, body);
		status = delivery.sent ? "sent" : "failed";
		message = delivery.message;
	}
	const totalBuy = rows.reduce((sum, r) => sum + r.buy_value, 0);
	const totalSell = rows.reduce((sum, r) => sum + r.sell_value, 0);
	for (const number of whatsappNumbers) await sendWhatsAppTemplate(env, number, "period_report_notice", [
		period,
		fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`,
		money(totalBuy),
		money(totalSell),
		money(totalSell - totalBuy)
	]);
	await db.prepare("INSERT INTO email_logs (report_date, recipients, subject, body, status, provider_message) VALUES (?, ?, ?, ?, ?, ?)").bind(fromDate, recipients.join(", "), subject, body, status, message).run();
	return {
		status,
		message,
		rows
	};
}
function isoWeekStart(dateStr) {
	const d = /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`);
	const diff = (d.getUTCDay() + 6) % 7;
	d.setUTCDate(d.getUTCDate() - diff);
	return d.toISOString().slice(0, 10);
}
async function runScheduledReports(db, env) {
	const date = today();
	await sendPeriodReport(db, env, "Daily", date, date);
	if ((/* @__PURE__ */ new Date(`${date}T00:00:00Z`)).getUTCDay() === 1) {
		const weekEnd = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
		weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);
		const weekEndStr = weekEnd.toISOString().slice(0, 10);
		await sendPeriodReport(db, env, "Weekly", isoWeekStart(weekEndStr), weekEndStr);
	}
	if (Number(date.slice(8, 10)) === 1) {
		const prevMonthEnd = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
		prevMonthEnd.setUTCDate(0);
		const to = prevMonthEnd.toISOString().slice(0, 10);
		await sendPeriodReport(db, env, "Monthly", `${to.slice(0, 7)}-01`, to);
	}
}
//#endregion
//#region worker/schema.ts
var TABLES = [
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
var ADDED_COLUMNS = [
	{
		table: "farmers",
		column: "deleted_at",
		ddl: "ALTER TABLE farmers ADD COLUMN deleted_at TEXT DEFAULT ''"
	},
	{
		table: "farmers",
		column: "email",
		ddl: "ALTER TABLE farmers ADD COLUMN email TEXT DEFAULT ''"
	},
	{
		table: "vendors",
		column: "deleted_at",
		ddl: "ALTER TABLE vendors ADD COLUMN deleted_at TEXT DEFAULT ''"
	},
	{
		table: "vendors",
		column: "email",
		ddl: "ALTER TABLE vendors ADD COLUMN email TEXT DEFAULT ''"
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
async function ensureBananaRatesGrade(db) {
	if (((await db.prepare("PRAGMA table_info(banana_rates)").all()).results || []).some((row) => row.name === "grade")) return;
	await db.batch([
		db.prepare("CREATE TABLE banana_rates_new (id INTEGER PRIMARY KEY AUTOINCREMENT, rate_date TEXT NOT NULL, banana_type TEXT NOT NULL, grade TEXT NOT NULL DEFAULT '1st grade', buy_rate REAL NOT NULL, sell_rate REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(rate_date, banana_type, grade))"),
		db.prepare("INSERT INTO banana_rates_new (id, rate_date, banana_type, grade, buy_rate, sell_rate, created_at) SELECT id, rate_date, banana_type, '1st grade', buy_rate, sell_rate, created_at FROM banana_rates"),
		db.prepare("DROP TABLE banana_rates"),
		db.prepare("ALTER TABLE banana_rates_new RENAME TO banana_rates"),
		db.prepare("CREATE INDEX IF NOT EXISTS banana_rates_lookup_idx ON banana_rates (rate_date, banana_type, grade)")
	]);
}
async function ensureDb(db) {
	await db.batch(TABLES.map((sql) => db.prepare(sql)));
	await ensureColumns(db);
	await ensureBananaRatesGrade(db);
	await db.prepare("CREATE INDEX IF NOT EXISTS banana_rates_lookup_idx ON banana_rates (rate_date, banana_type, grade)").run();
	const count = await db.prepare("SELECT COUNT(*) AS count FROM farmers").first();
	if (Number(count?.count || 0) === 0) await db.batch([
		db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Kumar Farms", "9876543210", "Pollachi", "North field road"),
		db.prepare("INSERT INTO farmers (name, phone, village, address) VALUES (?, ?, ?, ?)").bind("Selvi Garden", "9876501234", "Anaimalai", "Canal street"),
		db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Coimbatore Market", "9988776655", "Coimbatore", "Wholesale lane"),
		db.prepare("INSERT INTO vendors (name, phone, market, address) VALUES (?, ?, ?, ?)").bind("Town Fruit Traders", "8877665544", "Tiruppur", "Market road")
	]);
	const bananaTypeCount = await db.prepare("SELECT COUNT(*) AS count FROM banana_types").first();
	if (Number(bananaTypeCount?.count || 0) === 0) {
		await db.batch(BANANAS.map((banana) => db.prepare("INSERT INTO banana_types (name) VALUES (?)").bind(banana)));
		const day = today();
		await db.batch(BANANAS.map((banana, idx) => db.prepare("INSERT INTO banana_rates (rate_date, banana_type, grade, buy_rate, sell_rate) VALUES (?, ?, '1st grade', ?, ?)").bind(day, banana, [
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
//#region worker/state.ts
async function getState(db, url, user) {
	const month = url.searchParams.get("month") || currentMonth();
	const weekStart = /* @__PURE__ */ new Date(`${today()}T00:00:00`);
	weekStart.setDate(weekStart.getDate() - 13);
	const week = weekStart.toISOString().slice(0, 10);
	const [farmers, vendors, vehicles, bananaTypes, rates, purchaseInvoices, saleInvoices, settingsRows, emailLogs] = await Promise.all([
		listFarmers(db),
		listVendors(db),
		listVehicles(db),
		listBananaTypes(db),
		all(db, "SELECT * FROM banana_rates WHERE rate_date >= ? ORDER BY rate_date DESC, banana_type", week),
		listPurchaseInvoices(db, month),
		listSaleInvoices(db, month),
		all(db, "SELECT * FROM settings"),
		all(db, "SELECT * FROM email_logs ORDER BY id DESC LIMIT 20")
	]);
	return {
		month,
		farmers,
		vendors,
		vehicles,
		bananaTypes,
		rates,
		purchaseInvoices,
		saleInvoices,
		settings: Object.fromEntries(settingsRows.map((row) => [row.key, row.value])),
		emailLogs,
		staff: user.role === "owner" ? await listStaff(db) : [],
		auditLogs: user.role === "owner" ? await recentAudit(db) : [],
		me: user
	};
}
//#endregion
//#region worker/views/shell.ts
var STYLE = `
:root{--bg:#f4f6f3;--ink:#17211b;--muted:#66736a;--panel:#fff;--panel2:#f9fbf7;--line:#dce3d8;--line2:#eef2eb;--brand:#2f6b43;--brand2:#184c2c;--accent:#c9972d;--blue:#315f90;--bad:#b3463c;--ok:#2f7d4c;--shadow:0 16px 40px rgba(23,33,27,.08)}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 92% 8%,rgba(217,173,58,.17),transparent 280px),var(--bg);color:var(--ink);font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px}button,input,select,textarea{font:inherit}button,.btn{align-items:center;background:var(--brand);border:1px solid transparent;border-radius:7px;color:#fff;cursor:pointer;display:inline-flex;font-weight:760;gap:7px;justify-content:center;min-height:38px;padding:9px 13px;text-decoration:none;transition:background .15s,border-color .15s,box-shadow .15s}button:hover,.btn:hover{background:var(--brand2);box-shadow:0 8px 18px rgba(47,107,67,.18)}button.secondary,.btn.secondary{background:#fff;border-color:var(--line);color:var(--ink)}button.secondary:hover,.btn.secondary:hover{background:#f1f5ee;box-shadow:none}button.danger{background:var(--bad);color:#fff}button.small{min-height:30px;padding:5px 9px;font-size:.8rem}input,select,textarea{background:#fff;border:1px solid var(--line);border-radius:7px;color:var(--ink);outline:none;padding:10px 11px;width:100%}input:focus,select:focus,textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(47,107,67,.12)}textarea{min-height:80px;resize:vertical}h1,h2,h3,p{margin:0}.appframe{display:none;grid-template-columns:264px minmax(0,1fr);min-height:100vh}.auth-ready .appframe{display:grid}.authscreen{align-items:center;display:grid;min-height:100vh;padding:24px}.auth-ready .authscreen{display:none}.authcard{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.94));border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:18px;margin:auto;max-width:440px;padding:28px;width:100%}.authbrand{align-items:center;display:flex;gap:12px}.authbrand img{background:#fff;border:1px solid var(--line);border-radius:10px;height:58px;object-fit:contain;padding:5px;width:92px}.authcard h1{font-size:1.75rem;line-height:1.1}.authcopy{color:var(--muted);line-height:1.55}.authform{display:grid;gap:11px}.authform label{color:var(--muted);font-size:.74rem;font-weight:850;text-transform:uppercase}.authpanel{background:#f8faf6;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:.88rem;line-height:1.45;padding:12px}.accountbar{border-top:1px solid rgba(255,255,255,.12);display:grid;gap:10px;margin-top:16px;padding-top:16px}.accountbar span{color:#c7d8cc;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.accountbar .role{color:#9eb4a4;font-size:.72rem;text-transform:uppercase;font-weight:800}.accountbar button{background:transparent;border-color:rgba(255,255,255,.18);color:#dceade;justify-content:flex-start}.sidebar{background:#15291d;color:#dceade;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;overflow:auto}.brand{align-items:center;display:flex;gap:11px;margin-bottom:24px}.logo{background:#fff;border-radius:10px;display:block;height:46px;object-fit:contain;padding:5px;width:76px}.brand strong{display:block;font-size:1.02rem}.brand span{color:#9eb4a4;font-size:.78rem}.tabs{display:grid;gap:6px}.tabs button{background:transparent;border:1px solid transparent;color:#c7d8cc;justify-content:flex-start;padding:10px 12px}.tabs button:hover{background:rgba(255,255,255,.08);box-shadow:none}.tabs button.active{background:#e7f2e9;color:#183823}.sidefoot{border-top:1px solid rgba(255,255,255,.12);color:#98afa0;font-size:.78rem;line-height:1.45;margin-top:auto;padding-top:16px}.shell{max-width:1600px;padding:24px 28px 40px}.topbar{align-items:center;display:grid;gap:18px;grid-template-columns:minmax(0,1fr) 320px;margin-bottom:18px}.titleblock h1{font-size:clamp(1.8rem,3vw,3.1rem);letter-spacing:0;line-height:1.02}.copy{color:var(--muted);font-size:1rem;line-height:1.55;margin-top:10px;max-width:850px}.eyebrow{color:var(--accent);font-size:.72rem;font-weight:850;letter-spacing:0;text-transform:uppercase}.datebox{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);display:grid;gap:10px;grid-template-columns:1fr auto;padding:14px}.datebox label{color:var(--muted);font-size:.74rem;font-weight:800;text-transform:uppercase}.datefield{display:grid;gap:5px}.metrics{display:grid;gap:12px;grid-template-columns:repeat(5,minmax(0,1fr));margin:16px 0}.metric{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 22px rgba(23,33,27,.05);display:grid;gap:9px;min-height:104px;padding:16px;position:relative}.metric:before{background:var(--brand);border-radius:10px 0 0 10px;content:"";inset:0 auto 0 0;position:absolute;width:4px}.metric span{color:var(--muted);font-size:.75rem;font-weight:850;text-transform:uppercase}.metric strong{font-size:clamp(1.1rem,2vw,1.6rem);letter-spacing:0}.view{display:none}.view.active{display:block}.grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:1.1fr 1fr 1fr}.panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(255,255,255,.92));border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 28px rgba(23,33,27,.05);padding:18px}.wide{grid-column:1/-1}.heading{align-items:end;display:flex;gap:12px;justify-content:space-between;margin-bottom:14px}.heading h2{font-size:1.2rem;line-height:1.2;margin-top:3px}.subcopy{color:var(--muted);font-size:.86rem;line-height:1.45;margin-top:5px}.formgrid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.formgrid button{align-self:end}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{display:flex;flex-wrap:wrap;gap:9px}.tablewrap{border:1px solid var(--line);border-radius:9px;overflow:auto}table{border-collapse:separate;border-spacing:0;width:100%}th,td{border-bottom:1px solid var(--line2);font-size:.86rem;padding:10px 11px;text-align:left;white-space:nowrap}tr:last-child td{border-bottom:0}th{background:#f6f8f4;color:var(--muted);font-size:.72rem;font-weight:850;position:sticky;text-transform:uppercase;top:0}td:first-child{color:var(--ink);font-weight:780}.num{text-align:right}.pill{background:#eef5ee;border:1px solid #d7e6d8;border-radius:999px;color:var(--brand2);display:inline-flex;font-size:.76rem;font-weight:820;padding:4px 8px;text-transform:capitalize}.pill.warn{background:#fff5dc;border-color:#ecd28c;color:#6b4d0d}.pill.bad{background:#fff0ee;border-color:#edc4bf;color:var(--bad)}.notice{background:#fff8e8;border:1px solid #ead394;border-radius:9px;color:#61470d;line-height:1.45;padding:12px}.printHint,.status{color:var(--muted);font-size:.86rem;line-height:1.45;min-height:22px}.danger:not(button){color:var(--bad)}.sectiongap{display:grid;gap:12px}.toast{background:#182d20;border-radius:8px;bottom:18px;box-shadow:var(--shadow);color:#fff;display:none;font-weight:760;left:50%;padding:11px 14px;position:fixed;transform:translateX(-50%);z-index:20}.toast.show{display:block}
.modal-backdrop{align-items:center;background:rgba(15,20,16,.55);display:none;inset:0;justify-content:center;padding:20px;position:fixed;z-index:40}.modal-backdrop.show{display:flex}.modal{background:#fff;border-radius:12px;box-shadow:var(--shadow);max-height:88vh;max-width:640px;overflow:auto;padding:20px;width:100%}.modal-head{align-items:center;display:flex;justify-content:space-between;margin-bottom:14px}.modal-head button{background:transparent;border:0;color:var(--muted);font-size:1.3rem;min-height:auto;padding:2px 6px}.balance-due{color:var(--bad);font-weight:800}.balance-clear{color:var(--ok);font-weight:800}
.subtabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.subtabs button{background:#fff;border:1px solid var(--line);color:var(--muted);min-height:32px;padding:7px 13px}.subtabs button.active{background:var(--brand);border-color:transparent;color:#fff}.subview{display:none}.subview.active{display:block}
@media(max-width:1120px){.appframe{grid-template-columns:1fr}.sidebar{height:auto;position:static}.tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.sidefoot{display:none}.topbar,.grid,.grid.three{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.formgrid,.four,.five{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){body{font-size:13px}.shell{padding:14px}.sidebar{padding:14px}.tabs{grid-template-columns:1fr 1fr}.topbar{gap:12px}.datebox,.metrics,.formgrid,.two,.four,.five{grid-template-columns:1fr}.heading{align-items:start;flex-direction:column}.titleblock h1{font-size:2rem}}
`;
var CLIENT_SCRIPT = `
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
//#region worker/mastersImportExport.ts
var TEMPLATES = {
	farmers: [
		"name",
		"phone",
		"email",
		"village",
		"address",
		"gst",
		"notes"
	],
	vendors: [
		"name",
		"phone",
		"email",
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
	"banana-types": ["name"]
};
function mastersTemplate(type) {
	return TEMPLATES[type] || TEMPLATES.farmers;
}
async function exportMaster(db, type) {
	if (type === "vendors") return toCsv(TEMPLATES.vendors, await all(db, "SELECT name, phone, email, market, address, gst, notes FROM vendors WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name"));
	if (type === "vehicles") return toCsv(TEMPLATES.vehicles, await all(db, "SELECT vehicle_no, driver_name, phone, notes FROM vehicles WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY vehicle_no"));
	if (type === "banana-types") return toCsv(TEMPLATES["banana-types"], await all(db, "SELECT name FROM banana_types WHERE active = 1 ORDER BY name"));
	return toCsv(TEMPLATES.farmers, await all(db, "SELECT name, phone, email, village, address, gst, notes FROM farmers WHERE deleted_at = '' OR deleted_at IS NULL ORDER BY name"));
}
async function importMaster(db, type, rows, changedBy) {
	let count = 0;
	for (const row of rows) if (type === "farmers" && row.name) {
		await createFarmer(db, row, changedBy);
		count++;
	} else if (type === "vendors" && row.name) {
		await createVendor(db, row, changedBy);
		count++;
	} else if (type === "vehicles" && row.vehicle_no) {
		await createVehicle(db, row, changedBy);
		count++;
	} else if (type === "banana-types" && row.name) {
		await createBananaType(db, row, changedBy);
		count++;
	}
	await writeAudit(db, "master_import", 0, "create", changedBy, null, {
		type,
		count
	});
	return count;
}
//#endregion
//#region worker/index.ts
async function handleApi(request, env, url) {
	try {
		return await handleApiRoute(request, env, url);
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : "Something went wrong." }, 400);
	}
}
async function handleApiRoute(request, env, url) {
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
	if (url.pathname === "/api/banana-types") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createBananaType(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/banana-types/delete") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await deleteBananaType(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/rates") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await createRate(db, input, by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/masters/template") {
		const type = url.searchParams.get("type") || "farmers";
		return csv(mastersTemplate(type).join(",") + "\n", `${type}-template.csv`);
	}
	if (url.pathname === "/api/masters/export") {
		const type = url.searchParams.get("type") || "farmers";
		return csv(await exportMaster(db, type), `${type}.csv`);
	}
	if (url.pathname === "/api/masters/import") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ count: await importMaster(db, String(input.type || "farmers"), Array.isArray(input.rows) ? input.rows : [], by) });
	}
	if (url.pathname === "/api/purchase-invoices/create") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ id: await createPurchaseInvoice(db, input, by) });
	}
	if (url.pathname === "/api/purchase-invoices/detail") return json(await purchaseInvoiceDetail(db, Number(url.searchParams.get("id") || 0)));
	if (url.pathname === "/api/purchase-invoices/paid") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await updatePurchaseInvoicePaid(db, Number(input.id), Number(input.paid || 0), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/purchase-invoices/void") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		await voidPurchaseInvoice(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/purchase-invoices/send") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json(await sendPurchaseInvoice(db, env, Number(input.id), url.origin));
	}
	if (url.pathname === "/api/sale-invoices/vehicle-load") return json(await vehicleLoadAvailable(db, url.searchParams.get("vehicle_no") || "", url.searchParams.get("date") || ""));
	if (url.pathname === "/api/sale-invoices/create") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json({ id: await createSaleInvoice(db, input, by) });
	}
	if (url.pathname === "/api/sale-invoices/detail") return json(await saleInvoiceDetail(db, Number(url.searchParams.get("id") || 0)));
	if (url.pathname === "/api/sale-invoices/paid") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		await updateSaleInvoicePaid(db, Number(input.id), Number(input.paid || 0), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/sale-invoices/void") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		await voidSaleInvoice(db, Number(input.id), by);
		return json({ ok: true });
	}
	if (url.pathname === "/api/sale-invoices/send") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json(await sendSaleInvoice(db, env, Number(input.id), url.origin));
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
	if (url.pathname === "/api/reports/period") return json({ rows: await periodReport(db, url.searchParams.get("from") || "", url.searchParams.get("to") || "") });
	if (url.pathname === "/api/reports/send") {
		const denied = requireRole(user, ["owner", "staff"]);
		if (denied) return denied;
		return json(await sendPeriodReport(db, env, String(input.period || "Daily"), String(input.from), String(input.to)));
	}
	if (url.pathname === "/api/settings") {
		const denied = requireRole(user, ["owner"]);
		if (denied) return denied;
		const keys = [
			"daily_email_recipients",
			"weekly_email_recipients",
			"monthly_email_recipients",
			"whatsapp_numbers",
			...BUSINESS_SETTING_KEYS
		];
		for (const key of keys) await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, input[key] || "").run();
		return json({ ok: true });
	}
	return json({ error: "Not found" }, 404);
}
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/logo.png" && env.ASSETS) return env.ASSETS.fetch(request);
		if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
		if (url.pathname.startsWith("/purchase-invoice/") || url.pathname.startsWith("/sale-invoice/")) {
			if (!env.DB) return html("D1 database binding is missing.", 500);
			await ensureDb(env.DB);
			if (!await currentUser(env.DB, request)) return html("<!doctype html><html><head><meta charset=\"utf-8\"><title>Login required</title></head><body><p>Login required. Open the KMS Banana Desk and verify your email OTP before printing invoices.</p></body></html>", 401);
			const id = url.pathname.split("/").pop();
			return url.pathname.startsWith("/purchase-invoice/") ? purchaseInvoiceHtml(env.DB, id, env) : saleInvoiceHtml(env.DB, id, env);
		}
		return html(appShell());
	},
	async scheduled(_event, env) {
		if (!env.DB) return;
		await ensureDb(env.DB);
		await runScheduledReports(env.DB, env);
	}
};
//#endregion
export { worker_entry_default as default };
