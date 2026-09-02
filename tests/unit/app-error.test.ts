import { describe, expect, it } from "vitest";

import { AppError } from "../../src/shared/errors/app-error";

describe("AppError", () => {
  it("retains safe, stable error semantics", () => {
    const error = new AppError({ code: "CONFLICT", message: "Slot unavailable", httpStatus: 409 });

    expect(error).toMatchObject({
      name: "AppError",
      code: "CONFLICT",
      httpStatus: 409,
      expose: true
    });
  });

  it("does not expose internal errors by default when explicitly configured", () => {
    const error = new AppError({
      code: "INTERNAL_ERROR",
      message: "Internal failure",
      httpStatus: 500,
      expose: false
    });

    expect(error.expose).toBe(false);
  });
});
