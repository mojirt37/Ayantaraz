import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    // Keep `npm run test:e2e` runnable from a clean checkout. The standalone
    // server is a build artifact and must never be assumed to be present.
    command: "npm run build && HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      DATABASE_URL: "postgresql://user@127.0.0.1:5432/ayan_taraz",
      REDIS_URL: "redis://127.0.0.1:6379",
      OTP_HMAC_SECRET: randomBytes(32).toString("hex"),
      SESSION_HMAC_SECRET: randomBytes(32).toString("hex"),
      SMS_PROVIDER: "unconfigured-test-provider",
      SMS_TEMPLATE_ID: "test-template"
    }
  }
});
