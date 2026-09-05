import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { hashSessionToken } from "@/modules/identity/domain/session";
import { PostgresSessionStore } from "@/infrastructure/db/repositories/session-repository";
import type { Actor } from "@/modules/users/domain/authorization";

function requiredSecret(name: "SESSION_HMAC_SECRET"): string {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must be set with at least 32 characters`);
  return value;
}

function bearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

export async function requireSession(request: Request): Promise<Actor | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const store = new PostgresSessionStore();
  const record = await store.findActiveByTokenHash({ tokenHash: hashSessionToken(token, requiredSecret("SESSION_HMAC_SECRET")), now: new Date() });
  if (!record) return null;
  const users = await db.select({ id: S.users.id, role: S.users.role }).from(S.users).where(eq(S.users.id, record.userId)).limit(1);
  const user = users[0];
  if (!user) return null;
  return { userId: user.id, role: user.role };
}
