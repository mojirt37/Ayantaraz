import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` is a Next.js build-time boundary marker; Vitest executes server modules in Node.
      "server-only": new URL("./tests/support/server-only.ts", import.meta.url).pathname
    }
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "html"] }
  }
});
