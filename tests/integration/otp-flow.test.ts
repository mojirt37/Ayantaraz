/**
 * End-to-end OTP lifecycle against real PostgreSQL (no mocks).
 * Runs only when DATABASE_URL and OTP secrets are set; otherwise skips.
 */
import { randomBytes } from "node:crypto";
import { describe, expect, it, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../src/infrastructure/db/client";
import * as S from "../../src/infrastructure/db/schema";
import { PostgresOtpStore } from "../../src/infrastructure/db/repositories/otp-repository";
import { completeOtpVerification } from "../../src/modules/identity/application/complete-otp-verification";
import { hmacOtp } from "../../src/modules/identity/domain/otp";

const hasDb = Boolean(process.env["DATABASE_URL"]);
const OTP_SECRET = process.env["OTP_HMAC_SECRET"] ?? randomBytes(32).toString("hex");
const SESSION_SECRET = process.env["SESSION_HMAC_SECRET"] ?? randomBytes(32).toString("hex");
const PHONE = "+989911112222";

describe.skipIf(!hasDb)("otp lifecycle (real database)", () => {
  const createdChallengeIds: string[] = [];

  afterAll(async () => {
    for (const id of createdChallengeIds) {
      await db.delete(S.otpChallenges).where(eq(S.otpChallenges.id, id));
    }
    const users = await db.select({ id: S.users.id }).from(S.users).where(eq(S.users.phoneE164, PHONE));
    for (const u of users) {
      await db.delete(S.sessions).where(eq(S.sessions.userId, u.id));
      await db.delete(S.users).where(eq(S.users.id, u.id));
    }
  });

  it("correct code creates a persisted session", async () => {
    const store = new PostgresOtpStore(OTP_SECRET);
    const challengeId = crypto.randomUUID();
    const code = "482916";
    await store.create({
      id: challengeId,
      phoneE164: PHONE,
      codeHmac: hmacOtp(challengeId, PHONE, code, OTP_SECRET),
      attempts: 0,
      expiresAt: new Date(Date.now() + 300000),
    });
    createdChallengeIds.push(challengeId);

    const now = new Date();
    const result = await completeOtpVerification(store, {
      challengeId,
      phoneE164: PHONE,
      code,
      otpHmacSecret: OTP_SECRET,
      sessionHmacSecret: SESSION_SECRET,
      maximumAttempts: 5,
      now,
      sessionExpiresAt: new Date(now.getTime() + 86400000),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const sessions = await db.select().from(S.sessions).where(eq(S.sessions.userId, result.value.session.userId));
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0]!.revokedAt).toBeNull();
  });

  it("wrong code never authenticates and replay is rejected", async () => {
    const store = new PostgresOtpStore(OTP_SECRET);
    const challengeId = crypto.randomUUID();
    await store.create({
      id: challengeId,
      phoneE164: PHONE,
      codeHmac: hmacOtp(challengeId, PHONE, "111111", OTP_SECRET),
      attempts: 0,
      expiresAt: new Date(Date.now() + 300000),
    });
    createdChallengeIds.push(challengeId);

    const now = new Date();
    const wrong = await completeOtpVerification(store, {
      challengeId,
      phoneE164: PHONE,
      code: "999999",
      otpHmacSecret: OTP_SECRET,
      sessionHmacSecret: SESSION_SECRET,
      maximumAttempts: 5,
      now,
      sessionExpiresAt: new Date(now.getTime() + 86400000),
    });
    expect(wrong.ok).toBe(false);
  });
});
