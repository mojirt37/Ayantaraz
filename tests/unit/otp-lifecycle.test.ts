import { describe, expect, it } from "vitest";
import { consumeOtp, requestOtp } from "../../src/modules/identity/application/otp-lifecycle";

const policy = { expiresInSeconds: 120, maximumAttempts: 5 };
describe("OTP lifecycle", () => {
  it("persists only an HMAC before immediate SMS delivery", async () => {
    let stored = "";
    const result = await requestOtp(
      {
        create: async (c) => {
          stored = c.codeHmac;
        },
        invalidate: async () => undefined,
        consumeIfValid: async () => "NOT_FOUND"
      },
      { sendOtp: async ({ code }) => expect(code).toMatch(/^\d{6}$/) },
      {
        phoneE164: "+989121234567",
        clientIp: "192.0.2.1",
        hmacSecret: "a-32-character-minimum-hmac-secret!",
        policy,
        now: new Date()
      },
      { acquire: async () => true }
    );
    expect(result).toEqual({ ok: true, value: undefined });
    expect(stored).toMatch(/^[a-f0-9]{64}$/);
  });
  it("maps atomic replay/attempt outcomes safely", async () => {
    const result = await consumeOtp(
      {
        create: async () => undefined,
        invalidate: async () => undefined,
        consumeIfValid: async () => "ATTEMPT_LIMITED"
      },
      {
        challengeId: "c",
        phoneE164: "+989121234567",
        code: "123456",
        hmacSecret: "a-32-character-minimum-hmac-secret!",
        policy,
        now: new Date()
      }
    );
    expect(result).toMatchObject({ ok: false, error: { code: "RATE_LIMITED", httpStatus: 429 } });
  });

  it("rejects malformed input, explicit rate limits, and a duplicate verification without store bypass", async () => {
    const store = {
      create: async () => undefined,
      invalidate: async () => undefined,
      consumeIfValid: async () => "ALREADY_CONSUMED" as const
    };
    const verifyInput = {
      challengeId: "challenge-1",
      phoneE164: "+989121234567",
      code: "123456",
      hmacSecret: "a-32-character-minimum-hmac-secret!",
      policy,
      now: new Date()
    };
    await expect(consumeOtp(store, { ...verifyInput, code: "invalid" })).resolves.toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED", httpStatus: 401 }
    });
    await expect(consumeOtp(store, verifyInput)).resolves.toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED", httpStatus: 401 }
    });
    await expect(
      requestOtp(
        store,
        { sendOtp: async () => undefined },
        {
          phoneE164: "+989121234567",
          clientIp: "not-an-ip",
          hmacSecret: "a-32-character-minimum-hmac-secret!",
          policy,
          now: new Date()
        },
        { acquire: async () => false }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR", httpStatus: 422 } });
    await expect(
      requestOtp(
        store,
        { sendOtp: async () => undefined },
        {
          phoneE164: "+989121234567",
          clientIp: "192.0.2.1",
          hmacSecret: "a-32-character-minimum-hmac-secret!",
          policy,
          now: new Date()
        },
        { acquire: async () => false }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "RATE_LIMITED", httpStatus: 429 } });
  });

  it("fails closed on rate-limit failure and invalidates an undelivered challenge", async () => {
    const invalidated: string[] = [];
    const input = {
      phoneE164: "+989121234567",
      clientIp: "192.0.2.1",
      hmacSecret: "a-32-character-minimum-hmac-secret!",
      policy,
      now: new Date()
    };
    await expect(
      requestOtp(
        {
          create: async () => undefined,
          invalidate: async (id) => void invalidated.push(id),
          consumeIfValid: async () => "NOT_FOUND"
        },
        {
          sendOtp: async () => {
            throw new Error("provider timeout");
          }
        },
        input,
        { acquire: async () => true }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "DEPENDENCY_FAILURE", httpStatus: 503 } });
    expect(invalidated).toHaveLength(1);
    await expect(
      requestOtp(
        {
          create: async () => undefined,
          invalidate: async () => undefined,
          consumeIfValid: async () => "NOT_FOUND"
        },
        { sendOtp: async () => undefined },
        input,
        {
          acquire: async () => {
            throw new Error("redis unavailable");
          }
        }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "DEPENDENCY_FAILURE", httpStatus: 503 } });
  });
});
