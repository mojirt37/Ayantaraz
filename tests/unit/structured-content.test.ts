import { describe, expect, it } from "vitest";

import { validateStructuredContent } from "../../src/modules/content/domain/structured-content";

describe("structured content validation", () => {
  it("accepts typed text blocks", () => {
    expect(validateStructuredContent([{ kind: "HEADING", text: "عنوان" }])).toEqual({
      ok: true,
      value: [{ kind: "HEADING", text: "عنوان" }]
    });
  });

  it("rejects arbitrary markup and unknown blocks", () => {
    expect(
      validateStructuredContent([{ kind: "PARAGRAPH", text: "<script>alert(1)</script>" }])
    ).toMatchObject({ ok: false });
    expect(validateStructuredContent([{ kind: "HTML", text: "content" }])).toMatchObject({
      ok: false
    });
  });
});
