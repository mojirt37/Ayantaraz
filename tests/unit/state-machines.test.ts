import { describe, expect, it } from "vitest";

import { transitionAppointment } from "../../src/modules/appointment/domain/appointment-state";
import { transitionContent } from "../../src/modules/content/domain/content-state";
import { transitionPayment } from "../../src/modules/payment/domain/payment-state";
import { transitionVersion } from "../../src/modules/tax/domain/version-state";

describe("specified lifecycle state machines", () => {
  it("permits only the appointment transitions required by the specification", () => {
    expect(transitionAppointment("REQUESTED", "CONFIRMED")).toEqual({
      ok: true,
      value: "CONFIRMED"
    });
    expect(transitionAppointment("CONFIRMED", "CANCELLED")).toEqual({
      ok: true,
      value: "CANCELLED"
    });
    expect(transitionAppointment("COMPLETED", "CANCELLED")).toMatchObject({
      ok: false,
      error: { code: "DOMAIN_ERROR", httpStatus: 422 }
    });
  });

  it("makes manual payment decisions final", () => {
    expect(transitionPayment("PENDING", "CONFIRMED")).toEqual({ ok: true, value: "CONFIRMED" });
    expect(transitionPayment("REJECTED", "PENDING")).toMatchObject({ ok: false });
  });

  it("prevents an archived or published content version from being silently edited via transition", () => {
    expect(transitionContent("PREVIEW", "PUBLISHED")).toEqual({ ok: true, value: "PUBLISHED" });
    expect(transitionContent("PUBLISHED", "PREVIEW")).toMatchObject({ ok: false });
    expect(transitionContent("ARCHIVED", "DRAFT")).toMatchObject({ ok: false });
  });

  it("makes published tax/knowledge versions transition only to archived", () => {
    expect(transitionVersion("APPROVED", "PUBLISHED")).toEqual({ ok: true, value: "PUBLISHED" });
    expect(transitionVersion("PUBLISHED", "REVIEW")).toMatchObject({ ok: false });
  });
});
