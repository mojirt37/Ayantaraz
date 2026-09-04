import { failure, success, type Result } from "../../../shared/errors/result";

export type ReservationCommand = Readonly<{
  userId: string;
  slotId: string;
  idempotencyKey: string;
}>;
export type Reservation = Readonly<{
  appointmentId: string;
  slotId: string;
  userId: string;
  status: string;
}>;

/** Adapter must perform an atomic insert protected by the database unique slot constraint. */
export interface AppointmentReservationStore {
  reserve(
    command: ReservationCommand
  ): Promise<
    | { kind: "CREATED"; reservation: Reservation }
    | { kind: "SLOT_CONFLICT" }
    | { kind: "IDEMPOTENT"; reservation: Reservation }
  >;
}

export async function reserveAppointment(
  store: AppointmentReservationStore,
  command: ReservationCommand
): Promise<Result<Reservation>> {
  let result: Awaited<ReturnType<AppointmentReservationStore["reserve"]>>;
  try {
    result = await store.reserve(command);
  } catch {
    return failure(
      "DEPENDENCY_FAILURE",
      "Appointment reservation is temporarily unavailable.",
      503
    );
  }
  if (result.kind === "SLOT_CONFLICT") {
    return failure(
      "CONFLICT",
      "This time was just reserved by another user. Please choose another time.",
      409
    );
  }
  return success(result.reservation);
}
