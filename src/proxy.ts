import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const requestIdHeader = "x-request-id";
// Client-supplied IDs are accepted only in a strict shape to prevent log
// forgery; anything else is replaced with a server-generated srv- ID.
const CLIENT_ID_RE = /^req-[A-Za-z0-9_-]{8,64}$/;

function newRequestId(): string {
  return `srv-${crypto.randomUUID()}`;
}

export function proxy(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  const incoming = requestHeaders.get(requestIdHeader);
  const requestId = incoming && CLIENT_ID_RE.test(incoming) ? incoming : newRequestId();
  requestHeaders.set(requestIdHeader, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(requestIdHeader, requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
