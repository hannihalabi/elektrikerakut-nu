CREATE TABLE "site_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_site_events_type_created_at" ON "site_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_site_events_created_at" ON "site_events" USING btree ("created_at");