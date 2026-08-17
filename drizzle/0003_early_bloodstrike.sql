CREATE TABLE "service_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"issue" text NOT NULL,
	"postcode" text NOT NULL,
	"phone" text NOT NULL,
	"suggested_partner_id" integer,
	"assigned_partner_id" integer,
	"status" text DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_requests_public_id_unique" ON "service_requests" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "idx_service_requests_status_created_at" ON "service_requests" USING btree ("status","created_at");