import { failure, success, type Result } from "../../../shared/errors/result";

export const structuredBlockKinds = ["PARAGRAPH", "HEADING", "QUOTE", "LIST"] as const;
type StructuredBlockKind = (typeof structuredBlockKinds)[number];

export type StructuredBlock = Readonly<{
  kind: StructuredBlockKind;
  text: string;
}>;

export function validateStructuredContent(value: unknown): Result<readonly StructuredBlock[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return failure("VALIDATION_ERROR", "Content must contain at least one structured block.", 422);
  }

  const blocks: StructuredBlock[] = [];
  for (const candidate of value) {
    if (typeof candidate !== "object" || candidate === null) {
      return failure("VALIDATION_ERROR", "Content block is invalid.", 422);
    }
    const { kind, text } = candidate as { kind?: unknown; text?: unknown };
    if (
      typeof kind !== "string" ||
      !structuredBlockKinds.includes(kind as StructuredBlockKind) ||
      typeof text !== "string" ||
      text.trim().length === 0 ||
      /[<>]/.test(text)
    ) {
      return failure("VALIDATION_ERROR", "Content block is invalid.", 422);
    }
    blocks.push({ kind: kind as StructuredBlockKind, text: text.trim() });
  }

  return success(blocks);
}
