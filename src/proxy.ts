import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const requestIdHeader = "x-request-id";

export function proxy(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get(requestIdHeader) ?? crypto.randomUUID();
  requestHeaders.set(requestIdHeader, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(requestIdHeader, requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
