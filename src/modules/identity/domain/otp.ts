import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const otpDigits = 6;
const otpUpperBound = 10 ** otpDigits;

export type GeneratedOtp = Readonly<{
  code: string;
  codeHmac: string;
}>;

function otpMessage(challengeId: string, phoneE164: string, code: string): string {
  return `ayan-taraz:otp:${challengeId}:${phoneE164}:${code}`;
}

export function generateOtp(
  challengeId: string,
  phoneE164: string,
  hmacSecret: string
): GeneratedOtp {
  const code = randomInt(0, otpUpperBound).toString().padStart(otpDigits, "0");

  return {
    code,
    codeHmac: hmacOtp(challengeId, phoneE164, code, hmacSecret)
  };
}

export function hmacOtp(
  challengeId: string,
  phoneE164: string,
  code: string,
  hmacSecret: string
): string {
  return createHmac("sha256", hmacSecret)
    .update(otpMessage(challengeId, phoneE164, code))
    .digest("hex");
}

export function verifyOtp(
  challengeId: string,
  phoneE164: string,
  candidateCode: string,
  expectedHmac: string,
  hmacSecret: string
): boolean {
  if (!/^\d{6}$/.test(candidateCode) || !/^[a-f0-9]{64}$/.test(expectedHmac)) {
    return false;
  }

  const candidate = Buffer.from(hmacOtp(challengeId, phoneE164, candidateCode, hmacSecret), "hex");
  const expected = Buffer.from(expectedHmac, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
