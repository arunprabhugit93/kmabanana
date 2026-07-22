import { arrayBufferToBase64, e } from "./util";

export type BusinessDetails = {
  name: string;
  address: string;
  proprietor1Name: string;
  proprietor1Phone: string;
  proprietor2Name: string;
  proprietor2Phone: string;
};

// Defaults match the merchant's existing paper bill book so invoices look
// right out of the box; all of it is editable under Rates & Reports ->
// Business details without touching code.
const DEFAULTS: BusinessDetails = {
  name: "KMS Banana",
  address: "Chikkahole Checkpost, Chamarajnagar, Kongahalli Main Road, Thalavadi",
  proprietor1Name: "Prasanth K",
  proprietor1Phone: "94423 35317, 86680 77002",
  proprietor2Name: "Boopathi M",
  proprietor2Phone: "94881 33923, 63806 01633"
};

export const BUSINESS_SETTING_KEYS = [
  "business_name",
  "business_address",
  "proprietor1_name",
  "proprietor1_phone",
  "proprietor2_name",
  "proprietor2_phone"
];

export async function getBusinessDetails(db: D1Database): Promise<BusinessDetails> {
  const result = await db.prepare(
    "SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?, ?, ?)"
  ).bind(...BUSINESS_SETTING_KEYS).all<{ key: string; value: string }>();
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

export async function logoDataUrl(env: Env): Promise<string> {
  try {
    if (!env?.ASSETS) return "/logo.png";
    const response = await env.ASSETS.fetch(new Request("https://assets.local/logo.png"));
    if (!response.ok) return "/logo.png";
    return `data:image/png;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
  } catch {
    return "/logo.png";
  }
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigitWords(n: number): string {
  if (n < 100) return twoDigitWords(n);
  return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigitWords(n % 100) : "");
}

// Indian numbering (lakh/crore), e.g. 280416 -> "Two Lakh Eighty Thousand
// Four Hundred Sixteen Rupees Only" -- matches how amounts are traditionally
// written out on Indian invoices/cheques.
export function amountInWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero Rupees Only";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  const parts: string[] = [];
  if (crore) parts.push(threeDigitWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
  if (rest) parts.push(threeDigitWords(rest));
  return parts.join(" ") + " Rupees Only";
}

export function invoiceHeaderHtml(business: BusinessDetails, logoSrc: string): string {
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

export function partyBoxHtml(label: string, name: string, phone: string, locationLabel: string, location: string, address: string, email: string, gst: string): string {
  const lines = [
    phone ? `Phone: ${e(phone)}` : "",
    location ? `${locationLabel}: ${e(location)}` : "",
    address || "",
    email ? `Email: ${e(email)}` : "",
    gst ? `GST: ${e(gst)}` : ""
  ].filter(Boolean).join("<br>");
  return `<div class="box"><div class="label">${e(label)}</div><div class="value">${e(name)}</div>${lines ? `<p class="muted" style="margin-top:6px;line-height:1.5">${lines}</p>` : ""}</div>`;
}

export function signatureBlockHtml(businessName: string): string {
  return `<div class="signature"><p>For ${e(businessName)}</p><div class="sigline"></div><span class="muted">Authorised signatory</span></div>`;
}

export const INVOICE_STYLE = `*{box-sizing:border-box}body{background:radial-gradient(circle at 85% 6%,rgba(255,205,49,.24),transparent 260px),#f4f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;margin:0;padding:28px}
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
