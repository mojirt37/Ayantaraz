import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import type { SessionStore, SessionRecord } from "@/modules/identity/application/session-contract";

export class PostgresSessionStore implements SessionStore {
  async create(input: { userId: string; tokenHash: string; expiresAt: Date; createdAt: Date }): Promise<SessionRecord> {
    const id = crypto.randomUUID();
    await db.insert(S.sessions).values({ id, userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt });
    return { id, userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, revokedAt: null, createdAt: input.createdAt };
  }

  async findActiveByTokenHash(input: { tokenHash: string; now: Date }): Promise<SessionRecord | null> {
    const rows = await db
      .select()
      .from(S.sessions)
      .where(and(eq(S.sessions.tokenHash, input.tokenHash), isNull(S.sessions.revokedAt), gt(S.sessions.expiresAt, input.now)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, userId: row.userId, tokenHash: row.tokenHash, expiresAt: row.expiresAt, revokedAt: row.revokedAt, createdAt: row.createdAt };
  }

  async revoke(input: { sessionId: string; userId: string; revokedAt: Date }): Promise<"REVOKED" | "NOT_FOUND"> {
    const rows = await db.update(S.sessions).set({ revokedAt: input.revokedAt }).where(and(eq(S.sessions.id, input.sessionId), eq(S.sessions.userId, input.userId), isNull(S.sessions.revokedAt))).returning({ id: S.sessions.id });
    return rows.length > 0 ? "REVOKED" : "NOT_FOUND";
  }

  async revokeAllForUser(input: { userId: string; revokedAt: Date }): Promise<number> {
    const rows = await db.update(S.sessions).set({ revokedAt: input.revokedAt }).where(and(eq(S.sessions.userId, input.userId), isNull(S.sessions.revokedAt))).returning({ id: S.sessions.id });
    return rows.length;
  }
}
