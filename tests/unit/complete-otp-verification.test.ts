import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  completeOtpVerification,
  type OtpSessionStore
} from "../../src/modules/identity/application/complete-otp-verification";

const otpHmacSecret = randomBytes(32).toString("hex");
const sessionHmacSecret = randomBytes(32).toString("hex");
const now = new Date("2026-09-03T12:00:00Z");
const input = {
  challengeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  phoneE164: "+989121234567",
  code: "123456",
  otpHmacSecret,
  sessionHmacSecret,
  maximumAttempts: 5,
  now,
  sessionExpiresAt: new Date("2026-09-03T13:00:00Z")
};

describe("atomic OTP-to-session completion boundary", () => {
  it("only returns a bearer token after the atomic store commits a session", async () => {
    let persistedHash = "";
    const result = await completeOtpVerification(
      {
        consumeChallengeAndCreateSession: async (command) => {
          persistedHash = command.sessionTokenHash;
          return {
            kind: "CREATED",
            session: {
              userId: "user-1",
              sessionId: "session-1",
              expiresAt: command.sessionExpiresAt
            }
          };
        }
      },
      input
    );
    expect(result).toMatchObject({ ok: true, value: { session: { userId: "user-1" } } });
    if (!result.ok) throw new Error("Expected session creation.");
    expect(persistedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persistedHash).not.toContain(result.value.sessionToken);
  });

  it("does not expose a session token for failed verification or persistence", async () => {
    const limited: OtpSessionStore = {
      consumeChallengeAndCreateSession: async () => ({ kind: "ATTEMPT_LIMITED" })
    };
    await expect(completeOtpVerification(limited, input)).resolves.toMatchObject({
      ok: false,
      error: { code: "RATE_LIMITED", httpStatus: 429 }
    });
    await expect(
      completeOtpVerification(
        {
          consumeChallengeAndCreateSession: async () => {
            throw new Error("database unavailable");
          }
        },
        input
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "DEPENDENCY_FAILURE", httpStatus: 503 } });
  });
});
