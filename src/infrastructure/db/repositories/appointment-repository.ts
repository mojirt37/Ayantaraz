import { eq, and } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import type { AppointmentReservationStore } from "@/modules/appointment/application/reserve-appointment";
import type { PaymentDecisionStore } from "@/modules/payment/application/decide-payment";

export class PostgresAppointmentStore implements AppointmentReservationStore {
  async reserve(command: { userId: string; slotId: string; idempotencyKey: string }): Promise<
    | { kind: "CREATED"; reservation: { appointmentId: string; slotId: string; userId: string; status: string } }
    | { kind: "SLOT_CONFLICT" }
    | { kind: "IDEMPOTENT"; reservation: { appointmentId: string; slotId: string; userId: string; status: string } }
  > {
    const existing = await db
      .select()
      .from(S.appointments)
      .where(and(eq(S.appointments.userId, command.userId), eq(S.appointments.idempotencyKey, command.idempotencyKey)))
      .limit(1);
    if (existing[0]) {
      return { kind: "IDEMPOTENT", reservation: { appointmentId: existing[0].id, slotId: command.slotId, userId: command.userId, status: existing[0].status } };
    }
    try {
      const inserted = await db
        .insert(S.appointments)
        .values({
          slotId: command.slotId,
          userId: command.userId,
          idempotencyKey: command.idempotencyKey,
          status: "REQUESTED",
        })
        .returning({ id: S.appointments.id, slotId: S.appointments.slotId, userId: S.appointments.userId, status: S.appointments.status });
      const created = inserted[0];
      if (!created) throw new Error("Insert failed");
      return { kind: "CREATED", reservation: { appointmentId: created.id, slotId: created.slotId, userId: created.userId, status: created.status } };
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === "23505") return { kind: "SLOT_CONFLICT" };
      throw err;
    }
  }
}

export class PostgresPaymentStore implements PaymentDecisionStore {
  async decide(input: { paymentId: string; actorId: string; decision: "CONFIRMED" | "REJECTED" }): Promise<"DECIDED" | "NOT_FOUND" | "CONFLICT"> {
    const rows = await db.select().from(S.payments).where(eq(S.payments.id, input.paymentId)).limit(1);
    const row = rows[0];
    if (!row) return "NOT_FOUND";
    if (row.status !== "PENDING") return "CONFLICT";
    const { appendAudit } = await import("@/infrastructure/db/audit");
    await db.transaction(async (tx) => {
      await tx.update(S.payments).set({ status: input.decision, decidedAt: new Date(), decidedBy: input.actorId }).where(eq(S.payments.id, input.paymentId));
      await appendAudit(tx, {
        actorId: input.actorId,
        action: `PAYMENT_${input.decision}`,
        entityType: "payment",
        entityId: input.paymentId,
        metadata: { before: row.status, after: input.decision },
      });
    });
    return "DECIDED";
  }
}
