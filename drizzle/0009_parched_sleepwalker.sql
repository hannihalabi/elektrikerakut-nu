CREATE TABLE "seo_url_index_statuses" (
	"path" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"coverage_state" text,
	"verdict" text,
	"last_crawl_time" timestamp with time zone,
	"google_canonical" text,
	"inspected_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "idx_seo_url_index_statuses_state" ON "seo_url_index_statuses" USING btree ("state");
