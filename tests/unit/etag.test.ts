import { describe, expect, it } from "vitest";
import { etagNotModified, payloadEtag } from "../../src/shared/http/etag";

describe("payloadEtag", () => {
  it("is stable for identical payloads", () => {
    expect(payloadEtag({ a: 1 })).toBe(payloadEtag({ a: 1 }));
  });
});

describe("etagNotModified", () => {
  it("returns 304 on exact match", () => {
    const etag = payloadEtag({ slides: [] });
    const res = etagNotModified(new Request("http://x/", { headers: { "If-None-Match": etag } }), etag);
    expect(res?.status).toBe(304);
  });

  it("returns null when the client copy differs", () => {
    const res = etagNotModified(new Request("http://x/"), payloadEtag({ slides: [1] }));
    expect(res).toBeNull();
  });

  it("rejects forged values by simple inequality", () => {
    const res = etagNotModified(
      new Request("http://x/", { headers: { "If-None-Match": '"forged"' } }),
      payloadEtag({ slides: [] })
    );
    expect(res).toBeNull();
  });
});
