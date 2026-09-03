import { failure, success, type Result } from "../../../shared/errors/result";
import { hmacOtp } from "../domain/otp";
import { generateSessionToken, hashSessionToken } from "../domain/session";

export type OtpSessionCommit = Readonly<{
  userId: string;
  sessionId: string;
  expiresAt: Date;
}>;

/**
 * PostgreSQL transaction boundary for OTP verification. The adapter must atomically:
 * consume the challenge, find or create the phone identity, and create the hashed
 * session. Any non-CREATED result must commit neither identity nor session changes.
 */
export interface OtpSessionStore {
  consumeChallengeAndCreateSession(input: {
    challengeId: string;
    phoneE164: string;
    candidateHmac: string;
    maximumAttempts: number;
    now: Date;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
  }): Promise<
    | Readonly<{ kind: "CREATED"; session: OtpSessionCommit }>
    | Readonly<{ kind: "EXPIRED" | "ALREADY_CONSUMED" | "ATTEMPT_LIMITED" | "NOT_FOUND" }>
  >;
}

export type CompletedOtpVerification = Readonly<{
  sessionToken: string;
  session: OtpSessionCommit;
}>;

export async function completeOtpVerification(
  store: OtpSessionStore,
  input: {
    challengeId: string;
    phoneE164: string;
    code: string;
    otpHmacSecret: string;
    sessionHmacSecret: string;
    maximumAttempts: number;
    now: Date;
    sessionExpiresAt: Date;
  }
): Promise<Result<CompletedOtpVerification>> {
  if (
    !/^[0-9a-f-]{1,128}$/i.test(input.challengeId) ||
    !/^\+[1-9][0-9]{7,14}$/.test(input.phoneE164) ||
    !/^\d{6}$/.test(input.code) ||
    input.maximumAttempts <= 0 ||
    input.sessionExpiresAt.getTime() <= input.now.getTime()
  ) {
    return failure("UNAUTHENTICATED", "Verification code is invalid or expired.", 401);
  }

  const sessionToken = generateSessionToken();
  let outcome: Awaited<ReturnType<OtpSessionStore["consumeChallengeAndCreateSession"]>>;
  try {
    outcome = await store.consumeChallengeAndCreateSession({
      challengeId: input.challengeId,
      phoneE164: input.phoneE164,
      candidateHmac: hmacOtp(input.challengeId, input.phoneE164, input.code, input.otpHmacSecret),
      maximumAttempts: input.maximumAttempts,
      now: input.now,
      sessionTokenHash: hashSessionToken(sessionToken, input.sessionHmacSecret),
      sessionExpiresAt: input.sessionExpiresAt
    });
  } catch {
    return failure("DEPENDENCY_FAILURE", "Verification is temporarily unavailable.", 503);
  }
  if (outcome.kind === "CREATED") return success({ sessionToken, session: outcome.session });
  if (outcome.kind === "ATTEMPT_LIMITED") {
    return failure("RATE_LIMITED", "Too many verification attempts.", 429);
  }
  return failure("UNAUTHENTICATED", "Verification code is invalid or expired.", 401);
}
