import { describe, expect, it } from "vitest";
import { reserveAppointment } from "../../src/modules/appointment/application/reserve-appointment";
import {
  answerTaxClarification,
  startTaxQuestion
} from "../../src/modules/knowledge/application/resolve-tax-question";
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
  it("returns the original reservation for an idempotent retry", async () => {
    const reservation = {
      appointmentId: "a",
      slotId: "s",
      userId: "u",
      status: "REQUESTED" as const
    };
    await expect(
      reserveAppointment(
        { reserve: async () => ({ kind: "IDEMPOTENT" as const, reservation }) },
        { userId: "u", slotId: "s", idempotencyKey: "k" }
      )
    ).resolves.toEqual({ ok: true, value: reservation });
  });
  it("does not convert infrastructure failure into an appointment or payment success", async () => {
    await expect(
      reserveAppointment(
        {
          reserve: async () => {
            throw new Error("database unavailable");
          }
        },
        { userId: "u", slotId: "s", idempotencyKey: "k" }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "DEPENDENCY_FAILURE", httpStatus: 503 } });
    await expect(
      decidePayment(
        {
          decide: async () => {
            throw new Error("database unavailable");
          }
        },
        { userId: "admin", role: "ADMIN" },
        { paymentId: "p", decision: "CONFIRMED" }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "DEPENDENCY_FAILURE", httpStatus: 503 } });
  });
  it("requires admin before payment mutation", async () => {
    const result = await decidePayment(
      { decide: async () => "DECIDED" },
      { userId: "u", role: "USER" },
      { paymentId: "p", decision: "CONFIRMED" }
    );
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });
  it("rejects an invalid payment decision before persistence", async () => {
    let persisted = false;
    const result = await decidePayment(
      { decide: async () => ((persisted = true), "DECIDED" as const) },
      { userId: "admin", role: "ADMIN" },
      { paymentId: "p", decision: "PENDING" as never }
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR", httpStatus: 422 }
    });
    expect(persisted).toBe(false);
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
    expect(
      await prepareCalculation(
        {
          findPublishedRule: async () => ({
            ruleVersionId: "rule-1",
            engineVersion: "engine-1",
            effectiveFrom: "2026-01-01",
            effectiveTo: "2026-12-31",
            sourceReference: "approved-source"
          }),
          persistCalculation: async () => undefined
        },
        { taxType: "income", effectiveDate: "2027-01-01" }
      )
    ).toEqual({ kind: "OUT_OF_EFFECTIVE_RANGE" });
  });
  it("rejects an impossible effective date before querying a rule", async () => {
    let queried = false;
    await expect(
      prepareCalculation(
        {
          findPublishedRule: async () => {
            queried = true;
            return null;
          },
          persistCalculation: async () => undefined
        },
        { taxType: "income", effectiveDate: "2026-02-30" }
      )
    ).resolves.toEqual({ kind: "INVALID_INPUT" });
    expect(queried).toBe(false);
  });
  it("does not query a tax knowledge adapter for an empty clarification selection", async () => {
    let queried = false;
    await expect(
      answerTaxClarification(
        {
          getInitialNode: async () => null,
          select: async () => {
            queried = true;
            return null;
          }
        },
        { nodeId: "  ", optionId: "\u200f" }
      )
    ).resolves.toEqual({ kind: "NO_APPROVED_ANSWER" });
    expect(queried).toBe(false);
  });
  it("reports malformed published rule metadata instead of selecting it", async () => {
    await expect(
      prepareCalculation(
        {
          findPublishedRule: async () => ({
            ruleVersionId: "r",
            engineVersion: "",
            sourceReference: "source",
            effectiveFrom: "2026-01-01",
            effectiveTo: null
          }),
          persistCalculation: async () => undefined
        },
        { taxType: "income", effectiveDate: "2026-01-01" }
      )
    ).resolves.toEqual({ kind: "MALFORMED_RULE" });
  });
});
