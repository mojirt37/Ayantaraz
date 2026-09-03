import { describe, expect, it } from "vitest";

import {
  equalSessionHashes,
  generateSessionToken,
  hashSessionToken,
  isActiveSession
} from "../../src/modules/identity/domain/session";
import {
  sessionCookieOptions,
  type SessionStore
} from "../../src/modules/identity/application/session-contract";

const hmacSecret = "session-secret-with-production-length";

describe("session domain boundary", () => {
  it("generates opaque bearer tokens while exposing only a stable digest for persistence", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashSessionToken(token, hmacSecret)).toMatch(/^[a-f0-9]{64}$/);
    expect(
      equalSessionHashes(hashSessionToken(token, hmacSecret), hashSessionToken(token, hmacSecret))
    ).toBe(true);
    expect(
      equalSessionHashes(
        hashSessionToken(token, hmacSecret),
        hashSessionToken("another-token", hmacSecret)
      )
    ).toBe(false);
  });

  it("rejects expired and revoked sessions", () => {
    const now = new Date("2026-09-03T12:00:00Z");
    expect(
      isActiveSession(
        { tokenHash: "a".repeat(64), expiresAt: new Date("2026-09-03T12:00:01Z"), revokedAt: null },
        now
      )
    ).toBe(true);
    expect(
      isActiveSession({ tokenHash: "a".repeat(64), expiresAt: now, revokedAt: null }, now)
    ).toBe(false);
    expect(
      isActiveSession(
        { tokenHash: "a".repeat(64), expiresAt: new Date("2026-09-03T12:00:01Z"), revokedAt: now },
        now
      )
    ).toBe(false);
  });

  it("makes cookie security explicit and keeps session persistence adapter-only", () => {
    const expiresAt = new Date("2026-09-04T12:00:00Z");
    expect(sessionCookieOptions({ expiresAt, isProduction: true })).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    });
    expect(sessionCookieOptions({ expiresAt, isProduction: false }).secure).toBe(false);
    const store: SessionStore = {
      create: async () => ({
        id: "s",
        userId: "u",
        tokenHash: "a".repeat(64),
        expiresAt,
        revokedAt: null,
        createdAt: expiresAt
      }),
      findActiveByTokenHash: async () => null,
      revoke: async () => "NOT_FOUND",
      revokeAllForUser: async () => 0
    };
    expect(store).toBeDefined();
  });
});
