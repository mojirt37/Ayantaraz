import { failure, success, type Result } from "../../../shared/errors/result";

export const allowedMediaKinds = ["PDF", "JPEG", "PNG", "WEBP"] as const;
export type MediaKind = (typeof allowedMediaKinds)[number];

export type MediaUploadPolicy = Readonly<{
  maximumBytes: number;
  allowedKinds: readonly MediaKind[];
}>;

export type ValidatedMediaFile = Readonly<{
  kind: MediaKind;
  byteSize: number;
  safeFilename: string;
}>;

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((byte, index) => bytes[index] === byte);
}

export function detectMediaKind(bytes: Uint8Array): MediaKind | null {
  if (hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "PDF";
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return "JPEG";
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "PNG";
  if (
    hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    hasPrefix(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
  )
    return "WEBP";
  return null;
}

export function sanitizeFilename(filename: string): string {
  const baseName = filename.split(/[\\/]/).at(-1) ?? "upload";
  const normalized = baseName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized.replace(/^\.+/, "") || "upload";
}

export function validateMediaFile(
  input: { filename: string; declaredContentType: string; bytes: Uint8Array },
  policy: MediaUploadPolicy
): Result<ValidatedMediaFile> {
  if (!Number.isSafeInteger(policy.maximumBytes) || policy.maximumBytes <= 0) {
    return failure("INTERNAL_ERROR", "Invalid media upload policy.", 500);
  }
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > policy.maximumBytes) {
    return failure("VALIDATION_ERROR", "File size is not allowed.", 422);
  }

  const kind = detectMediaKind(input.bytes);
  if (kind === null || !policy.allowedKinds.includes(kind)) {
    return failure("VALIDATION_ERROR", "File content is not allowed.", 422);
  }

  // Browser-declared MIME is deliberately not trusted; byte signatures decide the kind.
  void input.declaredContentType;
  return success({
    kind,
    byteSize: input.bytes.byteLength,
    safeFilename: sanitizeFilename(input.filename)
  });
}
