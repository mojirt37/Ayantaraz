import { createHash } from "node:crypto";

/** Stable key ordering so the same logical input always hashes identically. */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
}

/**
 * Canonical SHA-256 over the normalized calculation input. Stored alongside
 * the snapshot so any historical result can be recomputed and proven equal.
 */
export function calculationInputHash(normalizedInput: Record<string, string>): string {
  return createHash("sha256").update(canonicalize(normalizedInput), "utf8").digest("hex");
}
