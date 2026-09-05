import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { resolveMediaUrl } from "@/modules/content/application/get-homepage-slides";

export interface PublishedVideo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  contentType: string;
  publishedAt: string | null;
}

export interface PublishedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string | null;
}

export interface PublishedMiniBook {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  publishedAt: string | null;
}

export async function getPublishedVideos(): Promise<PublishedVideo[]> {
  const rows = await db
    .select({
      id: S.videos.id,
      slug: S.videos.slug,
      title: S.videos.title,
      description: S.videos.description,
      storageKey: S.media.storageKey,
      contentType: S.media.contentType,
      publishedAt: S.videos.publishedAt,
    })
    .from(S.videos)
    .innerJoin(S.media, eq(S.videos.mediaId, S.media.id))
    .where(eq(S.videos.status, "PUBLISHED"))
    .orderBy(desc(S.videos.publishedAt));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    mediaUrl: resolveMediaUrl(r.storageKey),
    contentType: r.contentType,
    publishedAt: r.publishedAt?.toISOString() ?? null,
  }));
}

export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const rows = await db
    .select()
    .from(S.articles)
    .where(eq(S.articles.status, "PUBLISHED"))
    .orderBy(desc(S.articles.publishedAt));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    publishedAt: r.publishedAt?.toISOString() ?? null,
  }));
}

export async function getPublishedMiniBooks(): Promise<PublishedMiniBook[]> {
  const rows = await db
    .select({
      id: S.miniBooks.id,
      slug: S.miniBooks.slug,
      title: S.miniBooks.title,
      description: S.miniBooks.description,
      storageKey: S.media.storageKey,
      publishedAt: S.miniBooks.publishedAt,
    })
    .from(S.miniBooks)
    .innerJoin(S.media, eq(S.miniBooks.mediaId, S.media.id))
    .where(eq(S.miniBooks.status, "PUBLISHED"))
    .orderBy(desc(S.miniBooks.publishedAt));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    mediaUrl: resolveMediaUrl(r.storageKey),
    publishedAt: r.publishedAt?.toISOString() ?? null,
  }));
}
