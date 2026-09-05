import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import type { OtpChallengeStore } from "@/modules/identity/application/otp-contract";
import type { OtpSessionStore } from "@/modules/identity/application/complete-otp-verification";
import type { OtpRequestRateLimiter } from "@/modules/identity/application/otp-contract";

export class PostgresOtpStore implements OtpChallengeStore, OtpSessionStore {
  constructor(private readonly hmacSecret: string) {}

  async create(input: {
    id: string;
    phoneE164: string;
    codeHmac: string;
    attempts: number;
    expiresAt: Date;
  }): Promise<void> {
    await db.insert(S.otpChallenges).values({
      id: input.id,
      phoneE164: input.phoneE164,
      codeHmac: input.codeHmac,
      attemptCount: input.attempts,
      expiresAt: input.expiresAt,
    });
  }

  async consumeIfValid(input: {
    challengeId: string;
    candidateHmac: string;
    now: Date;
    maximumAttempts: number;
  }): Promise<"CONSUMED" | "ALREADY_CONSUMED" | "NOT_FOUND" | "ATTEMPT_LIMITED" | "EXPIRED"> {
    const rows = await db.select().from(S.otpChallenges).where(eq(S.otpChallenges.id, input.challengeId)).limit(1);
    const row = rows[0];
    if (!row) return "NOT_FOUND";
    if (row.consumedAt !== null) return "ALREADY_CONSUMED";
    if (input.now > row.expiresAt) return "EXPIRED";
    if (row.attemptCount >= input.maximumAttempts) return "ATTEMPT_LIMITED";
    if (row.codeHmac !== input.candidateHmac) {
      await db.update(S.otpChallenges).set({ attemptCount: sql`${S.otpChallenges.attemptCount} + 1` }).where(eq(S.otpChallenges.id, input.challengeId));
      return "ATTEMPT_LIMITED";
    }
    await db.update(S.otpChallenges).set({ consumedAt: input.now }).where(eq(S.otpChallenges.id, input.challengeId));
    return "CONSUMED";
  }

  async invalidate(id: string, now: Date): Promise<void> {
    await db.update(S.otpChallenges).set({ consumedAt: now }).where(eq(S.otpChallenges.id, id));
  }

  async consumeChallengeAndCreateSession(input: {
    challengeId: string;
    phoneE164: string;
    candidateHmac: string;
    maximumAttempts: number;
    now: Date;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
  }): Promise<
    | { kind: "CREATED"; session: { userId: string; sessionId: string; expiresAt: Date } }
    | { kind: "EXPIRED" | "ALREADY_CONSUMED" | "ATTEMPT_LIMITED" | "NOT_FOUND" }
  > {
    const rows = await db.select().from(S.otpChallenges).where(eq(S.otpChallenges.id, input.challengeId)).limit(1);
    const row = rows[0];
    if (!row) return { kind: "NOT_FOUND" };
    if (row.consumedAt !== null) return { kind: "ALREADY_CONSUMED" };
    if (input.now > row.expiresAt) return { kind: "EXPIRED" };
    if (row.attemptCount >= input.maximumAttempts) return { kind: "ATTEMPT_LIMITED" };
    if (row.codeHmac !== input.candidateHmac) {
      await db.update(S.otpChallenges).set({ attemptCount: sql`${S.otpChallenges.attemptCount} + 1` }).where(eq(S.otpChallenges.id, input.challengeId));
      return { kind: "ATTEMPT_LIMITED" };
    }

    const userIdRow = await db.select({ id: S.users.id }).from(S.users).where(eq(S.users.phoneE164, input.phoneE164)).limit(1);
    const userId = userIdRow[0]?.id ?? crypto.randomUUID();
    if (!userIdRow[0]) {
      await db.insert(S.users).values({ id: userId, phoneE164: input.phoneE164 });
    }
    const sessionId = crypto.randomUUID();
    await db.insert(S.sessions).values({
      id: sessionId,
      userId,
      tokenHash: input.sessionTokenHash,
      expiresAt: input.sessionExpiresAt,
    });
    await db.update(S.otpChallenges).set({ consumedAt: input.now }).where(eq(S.otpChallenges.id, input.challengeId));
    return { kind: "CREATED", session: { userId, sessionId, expiresAt: input.sessionExpiresAt } };
  }

  /**
   * Always-on database throttle: counts challenges created for this phone in
   * the trailing window. Used when Redis is unavailable so rate limiting is
   * never silently bypassed (fail-closed layer beneath the Redis layer).
   */
  async countRecentByPhone(input: { phoneE164: string; since: Date }): Promise<number> {
    const rows = await db
      .select({ id: S.otpChallenges.id })
      .from(S.otpChallenges)
      .where(and(eq(S.otpChallenges.phoneE164, input.phoneE164), gte(S.otpChallenges.createdAt, input.since)));
    return rows.length;
  }
}

export class PostgresRateLimiter implements OtpRequestRateLimiter {
  constructor(private readonly redis: import("ioredis").Redis) {}

  async acquire(input: { phoneE164: string; clientIp: string; now: Date }): Promise<boolean> {
    const identifier = `otp:${input.phoneE164}`;
    const key = `ratelimit:${identifier}`;
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60);
    }
    return current <= 5;
  }
}
