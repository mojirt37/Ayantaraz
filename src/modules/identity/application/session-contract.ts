import type { PersistedSession } from "../domain/session";

export type SessionRecord = PersistedSession &
  Readonly<{
    id: string;
    userId: string;
    createdAt: Date;
  }>;

/**
 * PostgreSQL adapter boundary. `tokenHash` is an HMAC digest, never the bearer
 * token. The adapter is responsible for persistence, transaction ownership,
 * and filtering expired/revoked records on lookup.
 */
export interface SessionStore {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<SessionRecord>;
  findActiveByTokenHash(input: { tokenHash: string; now: Date }): Promise<SessionRecord | null>;
  revoke(input: {
    sessionId: string;
    userId: string;
    revokedAt: Date;
  }): Promise<"REVOKED" | "NOT_FOUND">;
  revokeAllForUser(input: { userId: string; revokedAt: Date }): Promise<number>;
}

export type SessionCookieOptions = Readonly<{
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  expires: Date;
}>;

export function sessionCookieOptions(input: {
  expiresAt: Date;
  isProduction: boolean;
}): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: input.isProduction,
    sameSite: "lax",
    path: "/",
    expires: input.expiresAt
  };
}
