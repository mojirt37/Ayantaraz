import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { sql } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  const requestId = (await headers()).get("x-request-id") ?? crypto.randomUUID();
  const checks: Record<string, string> = {};

  try {
    await db.execute(sql`SELECT 1 as ok`);
    checks.postgres = "ok";
  } catch {
    checks.postgres = "failed";
  }

  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const { Redis } = await import("ioredis");
      const r = new Redis(redisUrl, { commandTimeout: 2000 });
      const pong = await r.ping();
      await r.quit();
      checks.redis = pong === "PONG" ? "ok" : "failed";
    } else {
      checks.redis = "not-configured";
    }
  } catch {
    checks.redis = "failed";
  }

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "not-configured");
  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks },
    { headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } }
  );
}
