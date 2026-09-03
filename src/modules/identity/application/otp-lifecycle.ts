import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { failure, success, type Result } from "../../../shared/errors/result";
import { generateOtp, hmacOtp } from "../domain/otp";
import type { OtpChallengeStore, OtpRequestRateLimiter, SmsOtpSender } from "./otp-contract";

export type OtpPolicy = Readonly<{ expiresInSeconds: number; maximumAttempts: number }>;

export async function requestOtp(
  store: OtpChallengeStore,
  sender: SmsOtpSender,
  input: {
    phoneE164: string;
    clientIp: string;
    hmacSecret: string;
    policy: OtpPolicy;
    now: Date;
  },
  rateLimiter: OtpRequestRateLimiter
): Promise<Result<void>> {
  if (!/^\+[1-9][0-9]{7,14}$/.test(input.phoneE164))
    return failure("VALIDATION_ERROR", "Phone number is invalid.", 422);
  if (isIP(input.clientIp) === 0)
    return failure("VALIDATION_ERROR", "Client address is invalid.", 422);
  if (input.policy.expiresInSeconds <= 0 || input.policy.maximumAttempts <= 0)
    return failure("INTERNAL_ERROR", "OTP policy is invalid.", 500);
  try {
    if (!(await rateLimiter.acquire(input))) {
      return failure("RATE_LIMITED", "Please wait before requesting another code.", 429);
    }
  } catch {
    // Fail closed: authentication abuse controls must not be bypassed when Redis is unavailable.
    return failure("DEPENDENCY_FAILURE", "Verification is temporarily unavailable.", 503);
  }
  const id = randomUUID();
  const generated = generateOtp(id, input.phoneE164, input.hmacSecret);
  try {
    await store.create({
      id,
      phoneE164: input.phoneE164,
      codeHmac: generated.codeHmac,
      attempts: 0,
      expiresAt: new Date(input.now.getTime() + input.policy.expiresInSeconds * 1000)
    });
    await sender.sendOtp({ phoneE164: input.phoneE164, code: generated.code });
    return success(undefined);
  } catch {
    try {
      await store.invalidate(id, input.now);
    } catch {
      // The primary failure remains a dependency failure. The adapter must alert on failed invalidation.
    }
    return failure("DEPENDENCY_FAILURE", "Verification is temporarily unavailable.", 503);
  }
}

export async function consumeOtp(
  store: OtpChallengeStore,
  input: {
    challengeId: string;
    phoneE164: string;
    code: string;
    hmacSecret: string;
    policy: OtpPolicy;
    now: Date;
  }
): Promise<Result<void>> {
  if (!/^\+[1-9][0-9]{7,14}$/.test(input.phoneE164)) {
    return failure("UNAUTHENTICATED", "Verification code is invalid or expired.", 401);
  }
  if (input.policy.expiresInSeconds <= 0 || input.policy.maximumAttempts <= 0) {
    return failure("INTERNAL_ERROR", "OTP policy is invalid.", 500);
  }
  if (!/^[0-9a-f-]{1,128}$/i.test(input.challengeId) || !/^\d{6}$/.test(input.code)) {
    return failure("UNAUTHENTICATED", "Verification code is invalid or expired.", 401);
  }
  let result: Awaited<ReturnType<OtpChallengeStore["consumeIfValid"]>>;
  try {
    result = await store.consumeIfValid({
      challengeId: input.challengeId,
      candidateHmac: hmacOtp(input.challengeId, input.phoneE164, input.code, input.hmacSecret),
      now: input.now,
      maximumAttempts: input.policy.maximumAttempts
    });
  } catch {
    return failure("DEPENDENCY_FAILURE", "Verification is temporarily unavailable.", 503);
  }
  if (result === "CONSUMED") return success(undefined);
  if (result === "NOT_FOUND")
    return failure("UNAUTHENTICATED", "Verification code is invalid or expired.", 401);
  if (result === "ATTEMPT_LIMITED")
    return failure("RATE_LIMITED", "Too many verification attempts.", 429);
  return failure("UNAUTHENTICATED", "Verification code is invalid or expired.", 401);
}
