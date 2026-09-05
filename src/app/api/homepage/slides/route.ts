import { NextResponse } from "next/server";
import { getActiveHomepageSlides } from "@/modules/content/application/get-homepage-slides";

export async function GET(): Promise<NextResponse> {
  try {
    const slides = await getActiveHomepageSlides();
    return NextResponse.json({ slides }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return NextResponse.json({ error: "slides temporarily unavailable" }, { status: 503 });
  }
}
