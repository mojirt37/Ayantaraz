import { getServerEnvironment } from "./shared/validation/env";

/**
 * Production has no mock configuration path. Next invokes this before serving
 * requests, making absent infrastructure/secrets a startup failure instead of
 * an unsafe fallback at the first mutation.
 */
export async function register(): Promise<void> {
  if (process.env.NODE_ENV === "production") getServerEnvironment();
}
