import { index, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
    eventType: text("event_type", { enum: ["PAGE_VIEW", "MATCH_STARTED", "MATCH_FOUND"] }).notNull(),
    path: text("path").notNull().default("/"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_site_events_type_created_at").on(table.eventType, table.createdAt),
    index("idx_site_events_created_at").on(table.createdAt),
  ],
);

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type SiteEvent = typeof siteEvents.$inferSelect;
