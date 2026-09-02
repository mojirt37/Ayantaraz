import { describe, expect, it } from "vitest";

import { getPublicEnvironment, getServerEnvironment } from "../../src/shared/validation/env";

const validEnvironment = {
  NEXT_PUBLIC_APP_URL: "https://ayan-taraz.example",
  DATABASE_URL: "postgresql://user:password@db.example:5432/ayan_taraz",
  REDIS_URL: "redis://redis.example:6379",
  OTP_HMAC_SECRET: "a-32-character-minimum-hmac-secret!"
};

describe("environment validation", () => {
  it("accepts complete server configuration", () => {
    expect(getServerEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it("rejects an undersized OTP secret", () => {
    expect(() => getServerEnvironment({ ...validEnvironment, OTP_HMAC_SECRET: "short" })).toThrow();
  });

  it("rejects a public origin with a trailing slash", () => {
    expect(() =>
      getPublicEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_APP_URL: "https://ayan-taraz.example/"
      })
    ).toThrow();
  });
});
