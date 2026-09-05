"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { requireSession } from "@/shared/auth/require-session";
import { requireAdmin } from "@/modules/users/domain/authorization";
import { transitionVersion } from "@/modules/tax/domain/version-state";
import { transitionContent } from "@/modules/content/domain/content-state";

async function adminActor() {
  const { headers } = await import("next/headers");
  const requestHeaders = await headers();
  const actor = await requireSession({
    headers: { get: (name: string) => requestHeaders.get(name) },
  } as unknown as Request);
  const admin = requireAdmin(actor);
  if (!admin.ok) throw new Error(admin.error.code);
  return admin.value;
}

async function audit(action: string, entityType: string, entityId: string, actorId: string, metadata: Record<string, string>) {
  await db.insert(S.auditLogs).values({ actorId, action, entityType, entityId, metadata });
}

const versionTransitionSchema = z.object({
  versionId: z.string().uuid(),
  next: z.enum(["REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]),
});

export async function advanceTaxRuleVersion(formData: FormData): Promise<void> {
  const actor = await adminActor();
  const parsed = versionTransitionSchema.safeParse({
    versionId: formData.get("versionId"),
    next: formData.get("next"),
  });
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const now = new Date();
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(S.taxRuleVersions).where(eq(S.taxRuleVersions.id, parsed.data.versionId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error("NOT_FOUND");
    const next = transitionVersion(row.status, parsed.data.next);
    if (!next.ok) throw new Error(next.error.code);
    await tx
      .update(S.taxRuleVersions)
      .set({
        status: next.value,
        reviewedAt: parsed.data.next === "APPROVED" ? now : row.reviewedAt,
        reviewedBy: parsed.data.next === "APPROVED" ? actor.userId : row.reviewedBy,
        publishedAt: parsed.data.next === "PUBLISHED" ? now : row.publishedAt,
      })
      .where(eq(S.taxRuleVersions.id, row.id));
  });
  await audit("tax_rule_version.transition", "tax_rule_version", parsed.data.versionId, actor.userId, { next: parsed.data.next });
  revalidatePath("/admin");
}

const contentTransitionSchema = z.object({
  kind: z.enum(["article", "video", "minibook"]),
  id: z.string().uuid(),
  next: z.enum(["PREVIEW", "PUBLISHED", "ARCHIVED"]),
});

const contentTables = { article: S.articles, video: S.videos, minibook: S.miniBooks } as const;

export async function advanceContent(formData: FormData): Promise<void> {
  const actor = await adminActor();
  const parsed = contentTransitionSchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id"),
    next: formData.get("next"),
  });
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const table = contentTables[parsed.data.kind];
  const now = new Date();
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(table).where(eq(table.id, parsed.data.id)).limit(1);
    const row = rows[0];
    if (!row) throw new Error("NOT_FOUND");
    const next = transitionContent(row.status, parsed.data.next);
    if (!next.ok) throw new Error(next.error.code);
    await tx
      .update(table)
      .set({ status: next.value, publishedAt: parsed.data.next === "PUBLISHED" ? now : row.publishedAt })
      .where(eq(table.id, row.id));
  });
  await audit("content.transition", parsed.data.kind, parsed.data.id, actor.userId, { next: parsed.data.next });
  revalidatePath("/admin");
}

const slideToggleSchema = z.object({ id: z.string().uuid(), active: z.enum(["true", "false"]) });

export async function toggleSlide(formData: FormData): Promise<void> {
  const actor = await adminActor();
  const parsed = slideToggleSchema.safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  await db.update(S.homepageSlides).set({ active: parsed.data.active === "true" }).where(eq(S.homepageSlides.id, parsed.data.id));
  await audit("homepage_slide.toggle", "homepage_slide", parsed.data.id, actor.userId, { active: parsed.data.active });
  revalidatePath("/admin");
  revalidatePath("/");
}

const newDraftSchema = z.object({ taxRuleId: z.string().uuid() });

export async function createTaxRuleDraft(formData: FormData): Promise<void> {
  const actor = await adminActor();
  const parsed = newDraftSchema.safeParse({ taxRuleId: formData.get("taxRuleId") });
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const existing = await db.select().from(S.taxRuleVersions).where(eq(S.taxRuleVersions.taxRuleId, parsed.data.taxRuleId));
  const nextVersion = existing.reduce((m, r) => Math.max(m, r.version), 0) + 1;
  const [created] = await db
    .insert(S.taxRuleVersions)
    .values({
      taxRuleId: parsed.data.taxRuleId,
      version: nextVersion,
      status: "DRAFT",
      sourceReference: "پیش‌نویس مدیریتی — منبع قانونی باید پیش از بررسی ثبت شود",
      effectiveFrom: new Date(),
      executableDefinition: {},
    })
    .returning({ id: S.taxRuleVersions.id });
  if (created) await audit("tax_rule_version.create_draft", "tax_rule_version", created.id, actor.userId, { version: String(nextVersion) });
  revalidatePath("/admin");
}
