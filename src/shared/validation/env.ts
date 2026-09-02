import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OTP_HMAC_SECRET: z.string().min(32)
});

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith("/"), "must not end with a slash")
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function getPublicEnvironment(source: NodeJS.ProcessEnv = process.env): PublicEnvironment {
  return publicEnvironmentSchema.parse(source);
}

export function getServerEnvironment(
  source: NodeJS.ProcessEnv = process.env
): ServerEnvironment & PublicEnvironment {
  return { ...getPublicEnvironment(source), ...serverEnvironmentSchema.parse(source) };
}
