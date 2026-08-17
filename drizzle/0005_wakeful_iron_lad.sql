CREATE TABLE "admin_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "claimed_by_email" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "claimed_by_name" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_profiles_email_unique" ON "admin_profiles" USING btree ("email");