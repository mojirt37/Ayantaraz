import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export function payloadEtag(payload: unknown): string {
  return `"${createHash("sha256").update(JSON.stringify(payload), "utf8").digest("hex").slice(0, 32)}"`;
}

/**
 * Returns a 304 response when the client already holds this payload, else null.
 * Callers then return the 200 response with the ETag header attached.
 */
export function etagNotModified(request: Request, etag: string): NextResponse | null {
  const incoming = request.headers.get("if-none-match");
  if (incoming && incoming.split(",").map((t) => t.trim()).includes(etag)) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }
  return null;
}
