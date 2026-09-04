import { createHmac, randomBytes } from "node:crypto";

export function hmacOtp(challengeId: string, phoneE164: string, code: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`ayan-taraz:otp:${challengeId}:${phoneE164}:${code}`)
    .digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function generateOtp(): string {
  return randomInt(0, 999999).toString().padStart(6, "0");
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
