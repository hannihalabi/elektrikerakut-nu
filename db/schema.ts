import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export type GuideSectionRecord = {
  heading: string;
  paragraphs: string[];
  steps?: string[];
};

export const partners = pgTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull(),
    legalName: text("legal_name").notNull(),
    organizationNumber: text("organization_number").notNull(),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    website: text("website"),
    logoUrl: text("logo_url"),
    serviceAreas: text("service_areas").notNull(),
    capabilities: jsonb("capabilities").$type<string[]>().notNull(),
    availability: text("availability").notNull(),
    notes: text("notes"),
    source: text("source", { enum: ["SELF_SERVICE", "ADMIN"] }).notNull().default("SELF_SERVICE"),
    status: text("status", { enum: ["PENDING", "ACTIVE", "PAUSED", "REJECTED"] }).notNull().default("PENDING"),
    registrationVerifiedAt: timestamp("registration_verified_at", { withTimezone: true }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("partners_public_id_unique").on(table.publicId),
    uniqueIndex("partners_organization_number_unique").on(table.organizationNumber),
    index("idx_partners_status_created_at").on(table.status, table.createdAt),
  ],
);

export const siteEvents = pgTable(
  "site_events",
  {
    id: serial("id").primaryKey(),
    eventType: text("event_type", { enum: ["PAGE_VIEW", "CTA_CLICK", "FORM_ERROR", "REQUEST_SUBMITTED", "MATCH_STARTED", "MATCH_FOUND", "MATCH_NOT_FOUND", "COVERAGE_UNAVAILABLE"] }).notNull(),
    path: text("path").notNull().default("/"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_site_events_type_created_at").on(table.eventType, table.createdAt),
    index("idx_site_events_created_at").on(table.createdAt),
  ],
);

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull(),
    issue: text("issue").notNull(),
    details: text("details"),
    postcode: text("postcode").notNull(),
    phone: text("phone").notNull(),
    suggestedPartnerId: integer("suggested_partner_id"),
    assignedPartnerId: integer("assigned_partner_id"),
    status: text("status", { enum: ["NEW", "CALLED", "BOOKED", "CLOSED", "NO_ANSWER"] }).notNull().default("NEW"),
    calledAt: timestamp("called_at", { withTimezone: true }),
    claimedByEmail: text("claimed_by_email"),
    claimedByName: text("claimed_by_name"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    bookedAt: timestamp("booked_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("service_requests_public_id_unique").on(table.publicId),
    index("idx_service_requests_status_created_at").on(table.status, table.createdAt),
  ],
);

export const adminProfiles = pgTable("admin_profiles", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("admin_profiles_email_unique").on(table.email)]);

export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("admin_credentials_email_unique").on(table.email)]);

export const adminPasswordResetTokens = pgTable("admin_password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("admin_password_reset_tokens_token_hash_unique").on(table.tokenHash),
  index("idx_admin_password_reset_tokens_email_created_at").on(table.email, table.createdAt),
]);

export const seoUrlIndexStatuses = pgTable("seo_url_index_statuses", {
  path: text("path").primaryKey(),
  state: text("state", { enum: ["INDEXED", "CRAWLED_NOT_INDEXED", "DISCOVERED_NOT_INDEXED", "EXCLUDED", "ERROR"] }).notNull(),
  coverageState: text("coverage_state"),
  verdict: text("verdict"),
  lastCrawlTime: timestamp("last_crawl_time", { withTimezone: true }),
  googleCanonical: text("google_canonical"),
  inspectedAt: timestamp("inspected_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("idx_seo_url_index_statuses_state").on(table.state)]);

export const bingUrlStatuses = pgTable("bing_url_statuses", {
  path: text("path").primaryKey(),
  state: text("state", { enum: ["INDEXED", "CRAWLED_NOT_INDEXED", "DISCOVERED_NOT_INDEXED", "NOT_DISCOVERED", "ERROR"] }).notNull(),
  indexed: boolean("indexed").notNull().default(false),
  discoveryDate: timestamp("discovery_date", { withTimezone: true }),
  lastCrawledDate: timestamp("last_crawled_date", { withTimezone: true }),
  httpStatus: integer("http_status"),
  bingIssues: jsonb("bing_issues").$type<string[]>().notNull().default([]),
  seoWarnings: jsonb("seo_warnings").$type<string[]>().notNull().default([]),
  robotsBlocked: boolean("robots_blocked").notNull().default(false),
  canonicalUrl: text("canonical_url"),
  canonicalIssue: boolean("canonical_issue").notNull().default(false),
  redirectUrl: text("redirect_url"),
  inspectedAt: timestamp("inspected_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_bing_url_statuses_state").on(table.state),
  index("idx_bing_url_statuses_inspected_at").on(table.inspectedAt),
]);

export const indexNowSubmissions = pgTable("indexnow_submissions", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  action: text("action", { enum: ["UPDATED", "DELETED"] }).notNull(),
  responseStatus: integer("response_status"),
  responseMessage: text("response_message"),
  success: boolean("success").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_indexnow_submissions_submitted_at").on(table.submittedAt),
  index("idx_indexnow_submissions_path").on(table.path),
]);

export const guidePosts = pgTable("guide_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  readTime: text("read_time").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  updatedLabel: text("updated_label").notNull(),
  accent: text("accent", { enum: ["blue", "green", "amber", "red"] }).notNull(),
  intro: text("intro").notNull(),
  safetyNote: text("safety_note").notNull(),
  sections: jsonb("sections").$type<GuideSectionRecord[]>().notNull(),
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url").notNull(),
  autoGenerated: boolean("auto_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("guide_posts_slug_unique").on(table.slug),
  index("idx_guide_posts_published_at").on(table.publishedAt),
  index("idx_guide_posts_auto_generated_created_at").on(table.autoGenerated, table.createdAt),
]);

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type SiteEvent = typeof siteEvents.$inferSelect;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type AdminProfile = typeof adminProfiles.$inferSelect;
export type AdminCredential = typeof adminCredentials.$inferSelect;
export type AdminPasswordResetToken = typeof adminPasswordResetTokens.$inferSelect;
export type SeoUrlIndexStatus = typeof seoUrlIndexStatuses.$inferSelect;
export type BingUrlStatus = typeof bingUrlStatuses.$inferSelect;
export type IndexNowSubmission = typeof indexNowSubmissions.$inferSelect;
export type GuidePostRecord = typeof guidePosts.$inferSelect;
