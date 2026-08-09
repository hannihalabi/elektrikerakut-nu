import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const partners = sqliteTable(
  "partners",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull(),
    legalName: text("legal_name").notNull(),
    organizationNumber: text("organization_number").notNull(),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    website: text("website"),
    serviceAreas: text("service_areas").notNull(),
    capabilities: text("capabilities").notNull(),
    availability: text("availability").notNull(),
    notes: text("notes"),
    source: text("source", { enum: ["SELF_SERVICE", "ADMIN"] }).notNull().default("SELF_SERVICE"),
    status: text("status", { enum: ["PENDING", "ACTIVE", "PAUSED", "REJECTED"] }).notNull().default("PENDING"),
    registrationVerifiedAt: integer("registration_verified_at", { mode: "timestamp_ms" }),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("partners_public_id_unique").on(table.publicId),
    uniqueIndex("partners_organization_number_unique").on(table.organizationNumber),
    index("idx_partners_status_created_at").on(table.status, table.createdAt),
  ],
);

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
