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
  consumeIfValid(input: {
    challengeId: string;
    candidateHmac: string;
    now: Date;
    maximumAttempts: number;
  }): Promise<"CONSUMED" | "EXPIRED" | "ALREADY_CONSUMED" | "ATTEMPT_LIMITED" | "NOT_FOUND">;
}

/** The SMS adapter receives the plaintext only for immediate delivery. */
export interface SmsOtpSender {
  sendOtp(input: { phoneE164: string; code: string }): Promise<void>;
}
