import { pgTable, uuid, text, integer, timestamp, jsonb, pgEnum, varchar, boolean } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const versionStatusEnum = pgEnum("version_status", ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "CONFIRMED", "REJECTED"]);
export const contentStatusEnum = pgEnum("content_status", ["DRAFT", "PREVIEW", "PUBLISHED", "ARCHIVED"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneE164: varchar("phone_e164", { length: 16 }).notNull().unique(),
  role: userRoleEnum("role").default("USER").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const otpChallenges = pgTable("otp_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneE164: varchar("phone_e164", { length: 16 }).notNull(),
  codeHmac: text("code_hmac").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consultations = pgTable("consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentSlots = pgTable("appointment_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  slotId: uuid("slot_id").notNull().references(() => appointmentSlots.id, { onDelete: "restrict" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  consultationId: uuid("consultation_id").references(() => consultations.id, { onDelete: "set null" }),
  status: appointmentStatusEnum("status").default("REQUESTED").notNull(),
  idempotencyKey: uuid("idempotency_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "restrict" }),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "restrict" }),
});

export const taxRules = pgTable("tax_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  stableKey: text("stable_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taxRuleVersions = pgTable("tax_rule_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taxRuleId: uuid("tax_rule_id").notNull().references(() => taxRules.id, { onDelete: "restrict" }),
  version: integer("version").notNull(),
  status: versionStatusEnum("status").default("DRAFT").notNull(),
  sourceReference: text("source_reference").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: false }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: false }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  executableDefinition: jsonb("executable_definition").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taxCalculations = pgTable("tax_calculations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  taxRuleVersionId: uuid("tax_rule_version_id").notNull().references(() => taxRuleVersions.id, { onDelete: "restrict" }),
  engineVersion: text("engine_version").notNull(),
  effectiveDate: timestamp("effective_date", { withTimezone: false }).notNull(),
  inputSnapshot: jsonb("input_snapshot").notNull(),
  outputSnapshot: jsonb("output_snapshot").notNull(),
  disclaimer: text("disclaimer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  stableKey: text("stable_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeVersions = pgTable("knowledge_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeArticleId: uuid("knowledge_article_id").notNull().references(() => knowledgeArticles.id, { onDelete: "restrict" }),
  version: integer("version").notNull(),
  status: versionStatusEnum("status").default("DRAFT").notNull(),
  sourceReference: text("source_reference").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: false }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: false }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  decisionTree: jsonb("decision_tree").notNull(),
  answerContent: jsonb("answer_content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  metadata: jsonb("metadata").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageKey: text("storage_key").notNull().unique(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: jsonb("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const miniBooks = pgTable("mini_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homepageSections = pgTable("homepage_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionKey: text("section_key").notNull().unique(),
  content: jsonb("content").notNull(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homepageSlides = pgTable("homepage_slides", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayOrder: integer("display_order").notNull(),
  imageMediaId: uuid("image_media_id").notNull().references(() => media.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  linkPath: text("link_path").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
