import { NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { eq } from "drizzle-orm";
import * as S from "@/infrastructure/db/schema";
import { headers } from "next/headers";
import { success, failure, type Result } from "@/shared/errors/result";
import { generateOtp, hmacOtp } from "@/shared/hash";
import { PostgresOtpStore } from "@/infrastructure/db/repositories/otp-repository";
import { createRedisClient, RedisRateLimiter } from "@/infrastructure/redis/ioredis-client";
import { completeOtpVerification } from "@/modules/identity/application/complete-otp-verification";

let redisClient: ReturnType<typeof createRedisClient> | null = null;
function getRedis() {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = createRedisClient(process.env.REDIS_URL);
  }
  return redisClient;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === "request-otp") {
    return handleRequestOtp(body);
  }
  if (action === "verify-otp") {
    return handleVerifyOtp(body);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

async function handleRequestOtp(body: { phone: string; ip: string }) {
  const phone = body.phone;
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) {
    return NextResponse.json({ error: "invalid phone" }, { status: 422 });
  }
  const redis = getRedis();
  const rateLimiter = redis ? new RedisRateLimiter(redis) : null;
  const otp = generateOtp();
  const challengeId = crypto.randomUUID();
  const hmacSecret = process.env.OTP_HMAC_SECRET ?? "";
  const codeHmac = hmacOtp(challengeId, phone, otp, hmacSecret);

  const store = new PostgresOtpStore(hmacSecret);
  await store.create({
    id: challengeId,
    phoneE164: phone,
    codeHmac,
    attempts: 0,
    expiresAt: new Date(Date.now() + 300000),
  });

  // In production, send via SMS provider here.
  console.info(`[OTP] challenge ${challengeId} for ${phone} — code sent (dev: ${otp})`);
  return NextResponse.json({ challengeId, status: "sent" });
}

async function handleVerifyOtp(body: { challengeId: string; phone: string; code: string }) {
  const hmacSecret = process.env.OTP_HMAC_SECRET ?? "";
  const sessionHmacSecret = process.env.SESSION_HMAC_SECRET ?? "";
  const store = new PostgresOtpStore(hmacSecret);
  const result = await completeOtpVerification(store, {
    challengeId: body.challengeId,
    phoneE164: body.phone,
    code: body.code,
    otpHmacSecret: hmacSecret,
    sessionHmacSecret,
    maximumAttempts: 5,
    now: new Date(),
    sessionExpiresAt: new Date(Date.now() + 86400000),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.httpStatus });
  }
  return NextResponse.json({ sessionToken: result.value.sessionToken, status: "authenticated" });
}
