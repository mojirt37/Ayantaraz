import { NextRequest, NextResponse } from "next/server";
import { asc, eq, gt } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { requireSession } from "@/shared/auth/require-session";

/**
 * GET /api/appointments/slots — upcoming bookable slots for the signed-in user.
 * Availability is computed server-side: a slot is available only when no
 * appointment row references it. The browser never decides availability.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const actor = await requireSession(request);
  if (!actor) return NextResponse.json({ error: "authentication required" }, { status: 401 });
  try {
    const rows = await db
      .select({
        id: S.appointmentSlots.id,
        startsAt: S.appointmentSlots.startsAt,
        endsAt: S.appointmentSlots.endsAt,
        appointmentId: S.appointments.id,
      })
      .from(S.appointmentSlots)
      .leftJoin(S.appointments, eq(S.appointments.slotId, S.appointmentSlots.id))
      .where(gt(S.appointmentSlots.startsAt, new Date()))
      .orderBy(asc(S.appointmentSlots.startsAt))
      .limit(30);
    return NextResponse.json(
      {
        slots: rows.map((r) => ({
          id: r.id,
          startsAt: r.startsAt.toISOString(),
          endsAt: r.endsAt.toISOString(),
          available: r.appointmentId === null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "slots temporarily unavailable" }, { status: 503 });
  }
}
