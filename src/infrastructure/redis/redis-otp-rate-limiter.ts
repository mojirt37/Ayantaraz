import "server-only";

import { createHmac } from "node:crypto";

import type { OtpRequestRateLimiter } from "../../modules/identity/application/otp-contract";
import { RedisCommandClient } from "./redis-client";

const atomicLimitScript = `
local phone = redis.call('INCR', KEYS[1])
if phone == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ip = redis.call('INCR', KEYS[2])
if ip == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end
if phone > tonumber(ARGV[2]) or ip > tonumber(ARGV[3]) then return 0 end
return 1`;

function opaqueIdentifier(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** A Redis-backed, atomic dual-key limiter; Redis is never used as a business store. */
export class RedisOtpRequestRateLimiter implements OtpRequestRateLimiter {
  public constructor(
    private readonly client: RedisCommandClient,
    private readonly keySecret: string,
    private readonly policy: { windowSeconds: number; phoneLimit: number; ipLimit: number }
  ) {}

  public async acquire(input: {
    phoneE164: string;
    clientIp: string;
    now: Date;
  }): Promise<boolean> {
    const bucket = Math.floor(input.now.getTime() / (this.policy.windowSeconds * 1_000));
    const phone = opaqueIdentifier(input.phoneE164, this.keySecret);
    const ip = opaqueIdentifier(input.clientIp, this.keySecret);
    const result = await this.client.eval(
      atomicLimitScript,
      [`ayan-taraz:otp:phone:${bucket}:${phone}`, `ayan-taraz:otp:ip:${bucket}:${ip}`],
      [
        String(this.policy.windowSeconds),
        String(this.policy.phoneLimit),
        String(this.policy.ipLimit)
      ]
    );
    return result === 1;
  }
}
