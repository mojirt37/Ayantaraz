import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "must be a PostgreSQL URL"
    ),
  REDIS_URL: z
    .string()
    .url()
    .refine(
      (value) => value.startsWith("redis://") || value.startsWith("rediss://"),
      "must be a Redis URL"
    ),
  OTP_HMAC_SECRET: z.string().min(32),
  SESSION_HMAC_SECRET: z.string().min(32),
  SMS_PROVIDER_URL: z.string().url().optional(),
  SMS_API_KEY: z.string().trim().min(1).optional(),
  MEDIA_BASE_URL: z.string().url().optional(),
  SMS_TEMPLATE_ID: z.string().trim().min(1)
});

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith("/"), "must not end with a slash")
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function getPublicEnvironment(source: EnvironmentSource = process.env): PublicEnvironment {
  return publicEnvironmentSchema.parse(source);
}

export function getServerEnvironment(
  source: EnvironmentSource = process.env
): ServerEnvironment & PublicEnvironment {
  return { ...getPublicEnvironment(source), ...serverEnvironmentSchema.parse(source) };
}
