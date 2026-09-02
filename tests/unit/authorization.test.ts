import { describe, expect, it } from "vitest";

import { requireAdmin, requireOwnership } from "../../src/modules/users/domain/authorization";

describe("server authorization decisions", () => {
  it("does not treat authentication as authorization", () => {
    expect(requireAdmin({ userId: "u1", role: "USER" })).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN", httpStatus: 403 }
    });
    expect(requireAdmin(null)).toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED", httpStatus: 401 }
    });
  });

  it("requires ownership unless the actor is an administrator", () => {
    expect(requireOwnership({ userId: "u1", role: "USER" }, "u2")).toMatchObject({ ok: false });
    expect(requireOwnership({ userId: "admin", role: "ADMIN" }, "u2")).toEqual({
      ok: true,
      value: { userId: "admin", role: "ADMIN" }
    });
  });
});
