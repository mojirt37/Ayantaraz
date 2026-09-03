import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import { generateOtp, verifyOtp } from "../../src/modules/identity/domain/otp";

const secret = randomBytes(32).toString("hex");
const challengeId = "f2cb32fa-1738-47bd-a8af-d218b0138a86";
const phone = "+989121234567";

describe("OTP cryptographic boundary", () => {
  it("generates a six-digit code and a non-plaintext HMAC representation", () => {
    const generated = generateOtp(challengeId, phone, secret);

    expect(generated.code).toMatch(/^\d{6}$/);
    expect(generated.codeHmac).toMatch(/^[a-f0-9]{64}$/);
    expect(generated.codeHmac).not.toBe(generated.code);
  });

  it("accepts only the original bound challenge, phone, and code", () => {
    const generated = generateOtp(challengeId, phone, secret);

    expect(verifyOtp(challengeId, phone, generated.code, generated.codeHmac, secret)).toBe(true);
    expect(verifyOtp(challengeId, phone, "000000", generated.codeHmac, secret)).toBe(false);
    expect(
      verifyOtp(challengeId, "+989111111111", generated.code, generated.codeHmac, secret)
    ).toBe(false);
  });
});
