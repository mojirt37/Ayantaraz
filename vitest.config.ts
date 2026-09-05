import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // `@/` mirrors tsconfig paths so tests resolve the same modules as the app.
      { find: "@", replacement: new URL("./src", import.meta.url).pathname },
      // `server-only` is a Next.js build-time boundary marker; Vitest executes server modules in Node.
      { find: "server-only", replacement: new URL("./tests/support/server-only.ts", import.meta.url).pathname }
    ]
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "html"] }
  }
});
