import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reserveAppointment } from "@/modules/appointment/application/reserve-appointment";
import { PostgresAppointmentStore } from "@/infrastructure/db/repositories/appointment-repository";
import { requireAdmin, requireOwnership } from "@/modules/users/domain/authorization";
import { decidePayment } from "@/modules/payment/application/decide-payment";
import { PostgresPaymentStore } from "@/infrastructure/db/repositories/appointment-repository";
import { prepareCalculation } from "@/modules/tax/application/prepare-calculation";
import { PostgresTaxStore } from "@/infrastructure/db/repositories/tax-knowledge-repository";
import { requireSession } from "@/shared/auth/require-session";

const reserveSchema = z.object({ userId: z.string().uuid(), slotId: z.string().uuid(), idempotencyKey: z.string().uuid() });
const paymentSchema = z.object({ paymentId: z.string().uuid(), decision: z.enum(["CONFIRMED", "REJECTED"]) });
const calcSchema = z.object({ taxType: z.string().min(1), effectiveDate: z.string().min(1) });

export async function POST(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const raw = await request.json().catch(() => null);
  if (raw === null || typeof raw !== "object") return NextResponse.json({ error: "invalid json body" }, { status: 400 });

  const actor = await requireSession(request);
  if (!actor) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  if (path.endsWith("/reserve")) {
    const parsed = reserveSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "validation error", issues: parsed.error.issues }, { status: 422 });
    const ownership = requireOwnership(actor, parsed.data.userId);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error.message }, { status: ownership.error.httpStatus });
    const result = await reserveAppointment(new PostgresAppointmentStore(), parsed.data);
    return NextResponse.json(result.ok ? { data: result.value } : { error: result.error.message }, { status: result.ok ? 201 : result.error.httpStatus });
  }

  if (path.endsWith("/payment")) {
    const admin = requireAdmin(actor);
    if (!admin.ok) return NextResponse.json({ error: admin.error.message }, { status: admin.error.httpStatus });
    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "validation error", issues: parsed.error.issues }, { status: 422 });
    const result = await decidePayment(new PostgresPaymentStore(), admin.value, parsed.data);
    return NextResponse.json(result.ok ? { data: "decided" } : { error: result.error.message }, { status: result.ok ? 200 : result.error.httpStatus });
  }

  if (path.endsWith("/tax/calculate")) {
    const parsed = calcSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "validation error", issues: parsed.error.issues }, { status: 422 });
    const result = await prepareCalculation(new PostgresTaxStore(), parsed.data);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "unknown route" }, { status: 404 });
}
