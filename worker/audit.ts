export async function writeAudit(
  db: D1Database,
  entityType: string,
  entityId: number,
  action: "create" | "update" | "delete" | "void" | "approve" | "reject",
  changedBy: string,
  before: unknown,
  after: unknown
) {
  await db.prepare(
    "INSERT INTO audit_logs (entity_type, entity_id, action, changed_by, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    entityType,
    entityId,
    action,
    changedBy || "",
    before ? JSON.stringify(before) : "",
    after ? JSON.stringify(after) : ""
  ).run();
}

export async function recentAudit(db: D1Database, limit = 60) {
  const result = await db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?").bind(limit).all();
  return result.results || [];
}
