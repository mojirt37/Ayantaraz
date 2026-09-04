import { NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { eq } from "drizzle-orm";
import * as S from "@/infrastructure/db/schema";
import { success, failure, type Result } from "@/shared/errors/result";
import { reserveAppointment } from "@/modules/appointment/application/reserve-appointment";
import { PostgresAppointmentStore } from "@/infrastructure/db/repositories/appointment-repository";
import { requireAdmin } from "@/modules/users/domain/authorization";
import { decidePayment } from "@/modules/payment/application/decide-payment";
import { PostgresPaymentStore } from "@/infrastructure/db/repositories/appointment-repository";
import { prepareCalculation } from "@/modules/tax/application/prepare-calculation";
import { PostgresTaxStore } from "@/infrastructure/db/repositories/tax-knowledge-repository";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const body = await request.json().catch(() => ({}));
  const headers_ = await request.headers;

  // Extract admin role from header (would be from session in production)
  const adminHeader = headers_.get("x-admin-id");
  const actor = adminHeader ? { userId: adminHeader, role: "ADMIN" as const } : null;

  if (path.endsWith("/reserve")) {
    const result = await reserveAppointment(new PostgresAppointmentStore(), {
      userId: body.userId,
      slotId: body.slotId,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json(result.ok ? { data: result.value } : { error: result.error.message }, { status: result.ok ? 201 : result.error.httpStatus });
  }

  if (path.endsWith("/payment")) {
    const result = await decidePayment(new PostgresPaymentStore(), actor, {
      paymentId: body.paymentId,
      decision: body.decision,
    });
    return NextResponse.json(result.ok ? { data: "decided" } : { error: result.error.message }, { status: result.ok ? 200 : result.error.httpStatus });
  }

  if (path.endsWith("/tax/calculate")) {
    const result = await prepareCalculation(new PostgresTaxStore(), {
      taxType: body.taxType,
      effectiveDate: body.effectiveDate,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "unknown route" }, { status: 404 });
}
