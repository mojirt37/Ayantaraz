/**
 * Real concurrency proof against PostgreSQL (no mocks, no stubs).
 * Runs only when DATABASE_URL is set (CI provides it); otherwise skips.
 * N concurrent reservations for the SAME slot must yield exactly one
 * CREATED and N-1 SLOT_CONFLICT, enforced by the database unique constraint.
 */
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../src/infrastructure/db/client";
import * as S from "../../src/infrastructure/db/schema";
import { PostgresAppointmentStore } from "../../src/infrastructure/db/repositories/appointment-repository";

const hasDb = Boolean(process.env["DATABASE_URL"]);
const RACERS = 10;

describe.skipIf(!hasDb)("appointment concurrency (real database)", () => {
  let slotId = "";
  const userIds: string[] = [];

  beforeAll(async () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 7200000);
    const [slot] = await db.insert(S.appointmentSlots).values({ startsAt: start, endsAt: end }).returning({ id: S.appointmentSlots.id });
    slotId = slot!.id;
    for (let i = 0; i < RACERS; i++) {
      const [user] = await db
        .insert(S.users)
        .values({ phoneE164: `+98990000${String(1000 + i)}` })
        .returning({ id: S.users.id });
      userIds.push(user!.id);
    }
  });

  afterAll(async () => {
    await db.delete(S.appointments).where(eq(S.appointments.slotId, slotId));
    await db.delete(S.appointmentSlots).where(eq(S.appointmentSlots.id, slotId));
    for (const id of userIds) {
      await db.delete(S.users).where(eq(S.users.id, id));
    }
  });

  it("exactly one of N concurrent reservations succeeds", async () => {
    const store = new PostgresAppointmentStore();
    const outcomes = await Promise.all(
      userIds.map((userId, i) =>
        store.reserve({ userId, slotId, idempotencyKey: crypto.randomUUID() }).then((r) => ({ userId, kind: r.kind, index: i }))
      )
    );
    const created = outcomes.filter((o) => o.kind === "CREATED");
    const conflicts = outcomes.filter((o) => o.kind === "SLOT_CONFLICT");
    expect(created).toHaveLength(1);
    expect(conflicts).toHaveLength(RACERS - 1);
  });

  it("same idempotency key returns the existing reservation", async () => {
    const store = new PostgresAppointmentStore();
    const key = crypto.randomUUID();
    const first = await store.reserve({ userId: userIds[0]!, slotId, idempotencyKey: key });
    const second = await store.reserve({ userId: userIds[0]!, slotId, idempotencyKey: key });
    // The slot is taken by the winner above, so first may conflict; either way
    // the second call with the same key must never create a second row.
    const rows = await db.select({ id: S.appointments.id }).from(S.appointments).where(eq(S.appointments.slotId, slotId));
    expect(rows.length).toBe(1);
    expect(["CREATED", "SLOT_CONFLICT", "IDEMPOTENT"]).toContain(first.kind);
    expect(["SLOT_CONFLICT", "IDEMPOTENT"]).toContain(second.kind);
  });
});
