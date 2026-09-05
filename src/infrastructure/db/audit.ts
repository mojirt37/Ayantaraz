import "server-only";
import { createHash } from "node:crypto";
import { desc } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
}

/**
 * Minimal structural surface shared by the database client and transactions,
 * so audit writes can participate in the caller's transaction.
 */
export interface AuditDatabase {
  select: typeof db.select;
  insert: typeof db.insert;
}

type DbOrTx = AuditDatabase;

/** Pure, deterministic chain hash. Exported for unit testing. */
export function computeEntryHash(input: {
  prevHash: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
}): string {
  const canonical = JSON.stringify({
    prevHash: input.prevHash,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: Object.fromEntries(Object.entries(input.metadata).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Appends a tamper-evident audit entry chained to the latest entry hash.
 * Concurrent writers may fork from the same prev_hash; forks are detectable
 * via verifyAuditChain and must be investigated, never silently merged.
 */
export async function appendAudit(database: DbOrTx, entry: AuditEntry): Promise<{ id: string; entryHash: string }> {
  const last = await database
    .select({ entryHash: S.auditLogs.entryHash })
    .from(S.auditLogs)
    .orderBy(desc(S.auditLogs.createdAt), desc(S.auditLogs.id))
    .limit(1);
  const prevHash = last[0]?.entryHash ?? null;
  const entryHash = computeEntryHash({ prevHash, ...entry });
  const inserted = await database
    .insert(S.auditLogs)
    .values({ ...entry, prevHash, entryHash })
    .returning({ id: S.auditLogs.id });
  const row = inserted[0];
  if (!row) throw new Error("audit append failed");
  return { id: row.id, entryHash };
}

/**
 * Normalizes legacy metadata shapes: rows written before the chained writer
 * may hold a JSON string instead of an object. Normalization is one-way and
 * documented so verification never false-positives on old rows.
 */
export function normalizeAuditMetadata(raw: unknown): Record<string, string> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      return { legacy: raw };
    }
  }
  return {};
}

/** Recomputes every link; returns the first broken entry id, or null when intact. */
export async function verifyAuditChain(database: DbOrTx, limit = 5000): Promise<{ ok: true } | { ok: false; brokenAtId: string }> {
  const rows = await database
    .select()
    .from(S.auditLogs)
    .orderBy(S.auditLogs.createdAt, S.auditLogs.id)
    .limit(limit);
  let prev: string | null = null;
  let chainStarted = false;
  for (const row of rows) {
    // Pre-chain legacy rows (empty hash, written before chaining existed) are
    // skipped until the chain starts; after that, contiguity is enforced.
    if (!chainStarted && !row.entryHash) continue;
    chainStarted = true;
    if ((row.prevHash ?? null) !== prev) return { ok: false, brokenAtId: row.id };
    const recomputed = computeEntryHash({
      prevHash: prev,
      actorId: row.actorId,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: normalizeAuditMetadata(row.metadata),
    });
    if (recomputed !== row.entryHash) return { ok: false, brokenAtId: row.id };
    prev = row.entryHash;
  }
  return { ok: true };
}
