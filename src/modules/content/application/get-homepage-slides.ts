import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";

export interface HomepageSlide {
  id: string;
  title: string;
  description: string;
  linkPath: string;
  imageUrl: string | null;
  contentType: string;
}

export function resolveMediaUrl(storageKey: string): string | null {
  const base = process.env["MEDIA_BASE_URL"];
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${storageKey.replace(/^\//, "")}`;
}

export async function getActiveHomepageSlides(limit = 6): Promise<HomepageSlide[]> {
  const rows = await db
    .select({
      id: S.homepageSlides.id,
      displayOrder: S.homepageSlides.displayOrder,
      title: S.homepageSlides.title,
      description: S.homepageSlides.description,
      linkPath: S.homepageSlides.linkPath,
      storageKey: S.media.storageKey,
      contentType: S.media.contentType,
    })
    .from(S.homepageSlides)
    .innerJoin(S.media, eq(S.homepageSlides.imageMediaId, S.media.id))
    .where(and(eq(S.homepageSlides.active, true)))
    .orderBy(asc(S.homepageSlides.displayOrder))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    linkPath: r.linkPath,
    imageUrl: resolveMediaUrl(r.storageKey),
    contentType: r.contentType,
  }));
}
