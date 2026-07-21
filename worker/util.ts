export const BANANAS = ["Nendran", "Robusta", "Poovan", "Red Banana"];
export const GRADES = ["1st grade", "2nd grade", "3rd grade"];

export function netWeight(grossWeightKg: unknown, units: unknown, stemReductionPerUnit: unknown): number {
  return Math.max(0, Number(grossWeightKg || 0) - Number(units || 0) * Number(stemReductionPerUnit || 0));
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

export function html(body: string, status = 200, extraHeaders: Record<string, string> = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(body, { status, headers });
}

export function csv(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}

export function e(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char as string] as string));
}

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
}

export async function all(db: D1Database, sql: string, ...binds: unknown[]) {
  const result = await db.prepare(sql).bind(...binds).all();
  return result.results || [];
}

export async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function cookieValue(request: Request, name: string): string {
  const cookie = request.headers.get("cookie") || "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

export async function sha256(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomDigits(length = 6): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 10 ** length).padStart(length, "0");
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isoAfter(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function money(value: unknown): string {
  return `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}
