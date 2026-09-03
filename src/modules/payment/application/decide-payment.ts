import { requireAdmin, type Actor } from "../../users/domain/authorization";
import { failure, success, type Result } from "../../../shared/errors/result";

export type PaymentDecision = "CONFIRMED" | "REJECTED";
export interface PaymentDecisionStore {
  decide(input: {
    paymentId: string;
    actorId: string;
    decision: PaymentDecision;
  }): Promise<"DECIDED" | "NOT_FOUND" | "CONFLICT">;
}

export async function decidePayment(
  store: PaymentDecisionStore,
  actor: Actor | null,
  input: { paymentId: string; decision: PaymentDecision }
): Promise<Result<void>> {
  const admin = requireAdmin(actor);
  if (!admin.ok) return admin;
  if (input.decision !== "CONFIRMED" && input.decision !== "REJECTED") {
    return failure("VALIDATION_ERROR", "Payment decision is invalid.", 422);
  }
  let result: Awaited<ReturnType<PaymentDecisionStore["decide"]>>;
  try {
    result = await store.decide({ ...input, actorId: admin.value.userId });
  } catch {
    return failure("DEPENDENCY_FAILURE", "Payment decision is temporarily unavailable.", 503);
  }
  if (result === "NOT_FOUND") return failure("NOT_FOUND", "Payment was not found.", 404);
  if (result === "CONFLICT") return failure("CONFLICT", "Payment has already been decided.", 409);
  return success(undefined);
}
