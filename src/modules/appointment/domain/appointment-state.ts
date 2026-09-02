import { failure, success, type Result } from "../../../shared/errors/result";

export const appointmentStatuses = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

const allowedTransitions: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

export function transitionAppointment(
  current: AppointmentStatus,
  next: AppointmentStatus
): Result<AppointmentStatus> {
  if (allowedTransitions[current].includes(next)) {
    return success(next);
  }

  return failure("DOMAIN_ERROR", "Invalid appointment state transition.", 422);
}
