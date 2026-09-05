import { describe, expect, it } from "vitest";
import { computeEntryHash } from "../../src/infrastructure/db/audit";

describe("computeEntryHash", () => {
  const base = {
    actorId: "actor-1",
    action: "tax_rule_version.transition",
    entityType: "tax_rule_version",
    entityId: "entity-1",
    metadata: { next: "PUBLISHED" },
  };

  it("chains to the previous hash", () => {
    const first = computeEntryHash({ prevHash: null, ...base });
    const second = computeEntryHash({ prevHash: first, ...base });
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).not.toBe(first);
  });

  it("is order-independent for metadata keys", () => {
    const a = computeEntryHash({ prevHash: null, ...base, metadata: { x: "1", y: "2" } });
    const b = computeEntryHash({ prevHash: null, ...base, metadata: { y: "2", x: "1" } });
    expect(a).toBe(b);
  });

  it("detects tampering", () => {
    const honest = computeEntryHash({ prevHash: null, ...base });
    const tampered = computeEntryHash({ prevHash: null, ...base, metadata: { next: "DRAFT" } });
    expect(honest).not.toBe(tampered);
  });
});

describe("normalizeAuditMetadata", () => {
  it("passes objects through", async () => {
    const { normalizeAuditMetadata } = await import("../../src/infrastructure/db/audit");
    expect(normalizeAuditMetadata({ a: "1" })).toEqual({ a: "1" });
  });

  it("parses legacy JSON strings", async () => {
    const { normalizeAuditMetadata } = await import("../../src/infrastructure/db/audit");
    expect(normalizeAuditMetadata('{"before":"PENDING","after":"CONFIRMED"}')).toEqual({
      before: "PENDING",
      after: "CONFIRMED",
    });
  });

  it("never throws on garbage", async () => {
    const { normalizeAuditMetadata } = await import("../../src/infrastructure/db/audit");
    expect(normalizeAuditMetadata(null)).toEqual({});
    expect(normalizeAuditMetadata(42)).toEqual({});
    expect(normalizeAuditMetadata("not-json{{{")).toEqual({ legacy: "not-json{{{" });
    expect(normalizeAuditMetadata(["x"])).toEqual({});
  });
});
