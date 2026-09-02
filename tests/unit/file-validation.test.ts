import { describe, expect, it } from "vitest";

import {
  detectMediaKind,
  sanitizeFilename,
  validateMediaFile
} from "../../src/modules/media/domain/file-validation";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const policy = { maximumBytes: 32, allowedKinds: ["PDF"] as const };

describe("media file validation", () => {
  it("uses content signatures rather than a browser-declared content type", () => {
    expect(detectMediaKind(pdf)).toBe("PDF");
    expect(
      validateMediaFile(
        { filename: "book.pdf", declaredContentType: "image/png", bytes: pdf },
        policy
      )
    ).toMatchObject({
      ok: true,
      value: { kind: "PDF", safeFilename: "book.pdf" }
    });
  });

  it("rejects unknown content and sanitizes untrusted filenames", () => {
    expect(
      validateMediaFile(
        {
          filename: "x.exe",
          declaredContentType: "application/pdf",
          bytes: new Uint8Array([1, 2])
        },
        policy
      )
    ).toMatchObject({ ok: false });
    expect(sanitizeFilename("../../کتاب نهایی.pdf")).toBe("__________.pdf");
  });
});
