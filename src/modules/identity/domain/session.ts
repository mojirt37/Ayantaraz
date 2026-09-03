import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Session persistence stores only this HMAC-SHA-256 digest, never the bearer token.
 * Expiry and revocation are evaluated by the authoritative database adapter.
 */
export type PersistedSession = Readonly<{
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}>;

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string, hmacSecret: string): string {
  return createHmac("sha256", hmacSecret).update(token, "utf8").digest("hex");
}

export function isActiveSession(session: PersistedSession, now: Date): boolean {
  return session.revokedAt === null && session.expiresAt.getTime() > now.getTime();
}

/** Constant-time comparison for adapter implementations that receive both digests. */
export function equalSessionHashes(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
