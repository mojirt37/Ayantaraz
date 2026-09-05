import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashSessionToken } from "@/modules/identity/domain/session";
import { PostgresSessionStore } from "@/infrastructure/db/repositories/session-repository";

function requiredSecret(): string | null {
  const value = process.env["SESSION_HMAC_SECRET"];
  return value && value.length >= 32 ? value : null;
}

function bearerToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
  return value ? decodeURIComponent(value) : null;
}

/**
 * DELETE /api/auth/session — revoke the current session (logout).
 * DELETE /api/auth/session?scope=all — revoke all sessions for the user.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const secret = requiredSecret();
  if (!secret) return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const store = new PostgresSessionStore();
  const now = new Date();
  const record = await store.findActiveByTokenHash({ tokenHash: hashSessionToken(token, secret), now });
  if (!record) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "all") {
    const count = await store.revokeAllForUser({ userId: record.userId, revokedAt: now });
    const jar = await cookies();
    jar.delete("session");
    return NextResponse.json({ status: "logged out", revoked: count });
  }
  await store.revoke({ sessionId: record.id, userId: record.userId, revokedAt: now });
  const jar = await cookies();
  jar.delete("session");
  return NextResponse.json({ status: "logged out", revoked: 1 });
}
