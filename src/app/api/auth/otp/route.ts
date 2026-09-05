import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { generateOtp, hmacOtp } from "@/shared/hash";
import { PostgresOtpStore } from "@/infrastructure/db/repositories/otp-repository";
import { createRedisClient, RedisRateLimiter } from "@/infrastructure/redis/ioredis-client";
import { completeOtpVerification } from "@/modules/identity/application/complete-otp-verification";
import { sessionCookieOptions } from "@/modules/identity/application/session-contract";
import { SmsDeliveryError, SmsNotConfiguredError, sendOtpSms } from "@/infrastructure/sms/sms-sender";

let redisClient: ReturnType<typeof createRedisClient> | null = null;
function getRedis() {
  if (!redisClient && process.env["REDIS_URL"]) {
    redisClient = createRedisClient(process.env["REDIS_URL"]);
  }
  return redisClient;
}

function requiredSecret(name: "OTP_HMAC_SECRET" | "SESSION_HMAC_SECRET"): string | null {
  const value = process.env[name];
  return value && value.length >= 32 ? value : null;
}

const requestSchema = z.object({
  action: z.literal("request-otp"),
  phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/, "invalid phone"),
  ip: z.string().max(64).optional(),
  // Honeypot: real users never fill it; bots do. Filled => silent fake success.
  website: z.string().max(0).optional(),
});

const DB_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const DB_THROTTLE_MAX = 5;

const verifySchema = z.object({
  action: z.literal("verify-otp"),
  challengeId: z.string().uuid(),
  phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/, "invalid phone"),
  code: z.string().regex(/^\d{6}$/, "invalid code"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  if (action === "request-otp") return handleRequestOtp(body);
  if (action === "verify-otp") return handleVerifyOtp(body);
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

async function handleRequestOtp(raw: unknown) {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid phone" }, { status: 422 });
  const { phone, ip, website } = parsed.data;
  if (website) {
    // Bot trap: identical success shape, no challenge created, nothing sent.
    return NextResponse.json({ challengeId: crypto.randomUUID(), status: "sent" });
  }

  const hmacSecret = requiredSecret("OTP_HMAC_SECRET");
  if (!hmacSecret) return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  const store = new PostgresOtpStore(hmacSecret);
  const redis = getRedis();
  if (redis) {
    const allowed = await new RedisRateLimiter(redis).acquire(`otp:${phone}:${ip ?? "unknown"}`);
    if (allowed === "RATE_LIMITED") return NextResponse.json({ error: "too many requests, try again later" }, { status: 429 });
  } else {
    // Fail-closed: database trailing-window throttle when Redis is absent.
    const recent = await store.countRecentByPhone({ phoneE164: phone, since: new Date(Date.now() - DB_THROTTLE_WINDOW_MS) });
    if (recent >= DB_THROTTLE_MAX) return NextResponse.json({ error: "too many requests, try again later" }, { status: 429 });
  }

  const otp = generateOtp();
  const challengeId = crypto.randomUUID();
  const codeHmac = hmacOtp(challengeId, phone, otp, hmacSecret);

  const now = new Date();
  await store.create({
    id: challengeId,
    phoneE164: phone,
    codeHmac,
    attempts: 0,
    expiresAt: new Date(now.getTime() + 300000),
  });

  // OTP code is never logged and never returned. Delivery via configured SMS provider only.
  try {
    await sendOtpSms({ phoneE164: phone, code: otp, templateId: process.env["SMS_TEMPLATE_ID"] ?? "otp" });
  } catch (error) {
    await store.invalidate(challengeId, new Date());
    if (error instanceof SmsNotConfiguredError) {
      return NextResponse.json({ error: "sms provider is not configured" }, { status: 503 });
    }
    if (error instanceof SmsDeliveryError) {
      return NextResponse.json({ error: "failed to deliver verification code" }, { status: 503 });
    }
    return NextResponse.json({ error: "failed to deliver verification code" }, { status: 503 });
  }
  return NextResponse.json({ challengeId, status: "sent" });
}

async function handleVerifyOtp(raw: unknown) {
  const parsed = verifySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid verification payload" }, { status: 422 });
  const { challengeId, phone, code } = parsed.data;

  const redis = getRedis();
  if (redis) {
    const allowed = await new RedisRateLimiter(redis).acquire(`otp-verify:${phone}`);
    if (allowed === "RATE_LIMITED") return NextResponse.json({ error: "too many attempts, try again later" }, { status: 429 });
  }
  const hmacSecret = requiredSecret("OTP_HMAC_SECRET");
  const sessionHmacSecret = requiredSecret("SESSION_HMAC_SECRET");
  if (!hmacSecret || !sessionHmacSecret) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  const store = new PostgresOtpStore(hmacSecret);
  const now = new Date();
  const result = await completeOtpVerification(store, {
    challengeId,
    phoneE164: phone,
    code,
    otpHmacSecret: hmacSecret,
    sessionHmacSecret,
    maximumAttempts: 5,
    now,
    sessionExpiresAt: new Date(now.getTime() + 86400000),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.httpStatus });
  }
  // Persist login in an HttpOnly session cookie so it survives reloads.
  const jar = await cookies();
  const cookieOptions = sessionCookieOptions({
    expiresAt: result.value.session.expiresAt,
    isProduction: process.env["NODE_ENV"] === "production",
  });
  jar.set("session", result.value.sessionToken, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    expires: cookieOptions.expires,
  });
  return NextResponse.json({ status: "authenticated" });
}
