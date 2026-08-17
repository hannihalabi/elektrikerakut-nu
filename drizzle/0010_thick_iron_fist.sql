CREATE TABLE "bing_url_statuses" (
	"path" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"indexed" boolean DEFAULT false NOT NULL,
	"discovery_date" timestamp with time zone,
	"last_crawled_date" timestamp with time zone,
	"http_status" integer,
	"bing_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seo_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"robots_blocked" boolean DEFAULT false NOT NULL,
	"canonical_url" text,
	"canonical_issue" boolean DEFAULT false NOT NULL,
	"redirect_url" text,
	"inspected_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexnow_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"action" text NOT NULL,
	"response_status" integer,
	"response_message" text,
	"success" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_bing_url_statuses_state" ON "bing_url_statuses" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_bing_url_statuses_inspected_at" ON "bing_url_statuses" USING btree ("inspected_at");--> statement-breakpoint
CREATE INDEX "idx_indexnow_submissions_submitted_at" ON "indexnow_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "idx_indexnow_submissions_path" ON "indexnow_submissions" USING btree ("path");