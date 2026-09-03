export type OtpChallenge = Readonly<{
  id: string;
  phoneE164: string;
  codeHmac: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
}>;

/**
 * The store implementation must consume a challenge atomically. It must never
 * return or persist an OTP plaintext value.
 */
export interface OtpChallengeStore {
  create(challenge: Omit<OtpChallenge, "consumedAt">): Promise<void>;
  /**
   * Makes a challenge unusable when delivery did not succeed. Implementations
   * must be idempotent so a retry cannot revive a failed challenge.
   */
  invalidate(challengeId: string, now: Date): Promise<void>;
  consumeIfValid(input: {
    challengeId: string;
    candidateHmac: string;
    now: Date;
    maximumAttempts: number;
  }): Promise<"CONSUMED" | "EXPIRED" | "ALREADY_CONSUMED" | "ATTEMPT_LIMITED" | "NOT_FOUND">;
}

/**
 * Redis-backed implementations rate-limit by both normalized phone and client
 * IP. `acquire` is atomic and returns false without revealing which key was
 * limited.
 */
export interface OtpRequestRateLimiter {
  acquire(input: { phoneE164: string; clientIp: string; now: Date }): Promise<boolean>;
}

/** The SMS adapter receives the plaintext only for immediate delivery. */
export interface SmsOtpSender {
  sendOtp(input: { phoneE164: string; code: string }): Promise<void>;
}
