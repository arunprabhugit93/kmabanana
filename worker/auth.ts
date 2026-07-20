import { sendEmail } from "./email";
import { cookieValue, isoAfter, json, randomDigits, randomToken, sha256 } from "./util";

export type Role = "owner" | "staff" | "cutter";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
};

export function sessionCookie(token: string, maxAge = 60 * 60 * 24 * 30) {
  return `kms_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return "kms_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

async function staffCount(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM staff_users").first<{ count: number }>();
  return Number(row?.count || 0);
}

async function findStaff(db: D1Database, email: string) {
  return db.prepare("SELECT email, name, role, active FROM staff_users WHERE email = ?").bind(email).first<{
    email: string;
    name: string;
    role: Role;
    active: number;
  }>();
}

export async function currentUser(db: D1Database, request: Request): Promise<AuthUser | null> {
  const token = cookieValue(request, "kms_session");
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await db.prepare("SELECT email, expires_at FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).first<{
    email: string;
    expires_at: string;
  }>();
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const staff = await findStaff(db, session.email);
  if (!staff || !staff.active) return null;
  await db.prepare("UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?").bind(tokenHash).run();
  return { email: staff.email, name: staff.name || "", role: staff.role };
}

export function requireRole(user: AuthUser, roles: Role[]): Response | null {
  if (!roles.includes(user.role)) return json({ error: "You do not have permission for this action." }, 403);
  return null;
}

async function sendOtpEmail(env: Env, email: string, code: string) {
  const subject = "KMS Banana login OTP";
  const text = `Your KMS Banana login OTP is ${code}. It expires in 10 minutes.`;
  return sendEmail(env, [email], subject, text);
}

export async function requestOtp(db: D1Database, env: Env, input: Record<string, unknown>) {
  const email = String(input.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);

  const bootstrap = (await staffCount(db)) === 0;
  if (!bootstrap) {
    const staff = await findStaff(db, email);
    if (!staff || !staff.active) {
      return json({ error: "This email is not authorized. Ask the owner to add you under Staff first." }, 403);
    }
  }

  const code = randomDigits();
  await db.prepare("INSERT INTO auth_otps (email, code_hash, expires_at) VALUES (?, ?, ?)").bind(email, await sha256(`${email}:${code}`), isoAfter(10)).run();
  const delivery = await sendOtpEmail(env, email, code);
  return json({
    ok: true,
    delivery: delivery.sent ? "sent" : "draft",
    dev_otp: delivery.sent ? undefined : code,
    bootstrap
  });
}

export async function verifyOtp(db: D1Database, input: Record<string, unknown>) {
  const email = String(input.email || "").trim().toLowerCase();
  const otp = String(input.otp || "").trim();
  const otpHash = await sha256(`${email}:${otp}`);
  const row = await db.prepare("SELECT id FROM auth_otps WHERE email = ? AND code_hash = ? AND used_at = '' AND expires_at > ? ORDER BY id DESC LIMIT 1").bind(email, otpHash, new Date().toISOString()).first<{ id: number }>();
  if (!row) return json({ error: "Invalid or expired OTP." }, 401);
  await db.prepare("UPDATE auth_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();

  const bootstrap = (await staffCount(db)) === 0;
  if (bootstrap) {
    await db.prepare("INSERT INTO staff_users (email, name, role, active) VALUES (?, ?, 'owner', 1)").bind(email, "").run();
  }
  const staff = await findStaff(db, email);
  if (!staff || !staff.active) return json({ error: "This email is not authorized." }, 403);

  const token = randomToken();
  await db.prepare("INSERT INTO auth_sessions (email, token_hash, expires_at) VALUES (?, ?, ?)").bind(email, await sha256(token), isoAfter(60 * 24 * 30)).run();
  return json(
    { ok: true, user: { email: staff.email, name: staff.name || "", role: staff.role } },
    200,
    { "set-cookie": sessionCookie(token) }
  );
}

export async function logout(db: D1Database, request: Request) {
  const token = cookieValue(request, "kms_session");
  if (token) await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}

export async function listStaff(db: D1Database) {
  const result = await db.prepare("SELECT id, email, name, role, active, created_at FROM staff_users ORDER BY created_at").all();
  return result.results || [];
}

export async function createStaff(db: D1Database, input: Record<string, unknown>) {
  const email = String(input.email || "").trim().toLowerCase();
  const role = ["owner", "staff", "cutter"].includes(String(input.role)) ? String(input.role) : "staff";
  if (!email) throw new Error("Email is required");
  await db.prepare("INSERT INTO staff_users (email, name, role, active) VALUES (?, ?, ?, 1) ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, active = 1")
    .bind(email, String(input.name || ""), role)
    .run();
}

export async function setStaffActive(db: D1Database, id: number, active: boolean) {
  await db.prepare("UPDATE staff_users SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
}
