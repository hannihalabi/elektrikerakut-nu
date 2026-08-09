CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"legal_name" text NOT NULL,
	"organization_number" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"website" text,
	"service_areas" text NOT NULL,
	"capabilities" jsonb NOT NULL,
	"availability" text NOT NULL,
	"notes" text,
	"source" text DEFAULT 'SELF_SERVICE' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"registration_verified_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "partners_public_id_unique" ON "partners" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_organization_number_unique" ON "partners" USING btree ("organization_number");--> statement-breakpoint
CREATE INDEX "idx_partners_status_created_at" ON "partners" USING btree ("status","created_at");