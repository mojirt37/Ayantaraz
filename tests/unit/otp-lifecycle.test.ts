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
        }
      },
      { sendOtp: async ({ code }) => expect(code).toMatch(/^\d{6}$/) },
      {
        phoneE164: "+989121234567",
        hmacSecret: "a-32-character-minimum-hmac-secret!",
        policy,
        now: new Date()
      }
    );
    expect(result).toEqual({ ok: true, value: undefined });
    expect(stored).toMatch(/^[a-f0-9]{64}$/);
  });
  it("maps atomic replay/attempt outcomes safely", async () => {
    const result = await consumeOtp(
      { create: async () => undefined, consumeIfValid: async () => "ATTEMPT_LIMITED" },
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
});
