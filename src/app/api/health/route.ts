import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const requestId = (await headers()).get("x-request-id");

  return NextResponse.json(
    { status: "ok" },
    {
      headers: { "Cache-Control": "no-store", ...(requestId ? { "X-Request-Id": requestId } : {}) }
    }
  );
}
