import { describe, expect, it } from "vitest";
import { reserveAppointment } from "../../src/modules/appointment/application/reserve-appointment";
import { startTaxQuestion } from "../../src/modules/knowledge/application/resolve-tax-question";
import { decidePayment } from "../../src/modules/payment/application/decide-payment";
import { prepareCalculation } from "../../src/modules/tax/application/prepare-calculation";

describe("application boundaries", () => {
  it("maps an atomic slot conflict without claiming success", async () => {
    const result = await reserveAppointment(
      { reserve: async () => ({ kind: "SLOT_CONFLICT" }) },
      { userId: "u", slotId: "s", idempotencyKey: "k" }
    );
    expect(result).toMatchObject({ ok: false, error: { code: "CONFLICT", httpStatus: 409 } });
  });
  it("requires admin before payment mutation", async () => {
    const result = await decidePayment(
      { decide: async () => "DECIDED" },
      { userId: "u", role: "USER" },
      { paymentId: "p", decision: "CONFIRMED" }
    );
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });
  it("never fabricates a Q&A answer or tax rule", async () => {
    expect(
      await startTaxQuestion({ getInitialNode: async () => null, select: async () => null })
    ).toEqual({ kind: "NO_APPROVED_ANSWER" });
    expect(
      await prepareCalculation(
        { findPublishedRule: async () => null, persistCalculation: async () => undefined },
        { taxType: "unknown", effectiveDate: "2026-01-01" }
      )
    ).toEqual({ kind: "NO_PUBLISHED_RULE" });
  });
});
