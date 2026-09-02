import { failure, success, type Result } from "../../../shared/errors/result";

export const paymentStatuses = ["PENDING", "CONFIRMED", "REJECTED"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

const allowedTransitions: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  PENDING: ["CONFIRMED", "REJECTED"],
  CONFIRMED: [],
  REJECTED: []
};

export function transitionPayment(
  current: PaymentStatus,
  next: PaymentStatus
): Result<PaymentStatus> {
  if (allowedTransitions[current].includes(next)) {
    return success(next);
  }

  return failure("DOMAIN_ERROR", "Invalid payment state transition.", 422);
}
