ALTER TABLE "service_requests" ADD COLUMN "called_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "booked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "closed_at" timestamp with time zone;