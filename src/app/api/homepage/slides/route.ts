import { NextRequest, NextResponse } from "next/server";
import { getActiveHomepageSlides } from "@/modules/content/application/get-homepage-slides";
import { etagNotModified, payloadEtag } from "@/shared/http/etag";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const slides = await getActiveHomepageSlides();
    const body = { slides };
    const etag = payloadEtag(body);
    const notModified = etagNotModified(request, etag);
    if (notModified) return notModified;
    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60", ETag: etag } });
  } catch {
    return NextResponse.json({ error: "slides temporarily unavailable" }, { status: 503 });
  }
}
