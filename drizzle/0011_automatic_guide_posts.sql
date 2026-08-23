CREATE TABLE "guide_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"read_time" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"updated_label" text NOT NULL,
	"accent" text NOT NULL,
	"intro" text NOT NULL,
	"safety_note" text NOT NULL,
	"sections" jsonb NOT NULL,
	"source_label" text NOT NULL,
	"source_url" text NOT NULL,
	"auto_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "guide_posts_slug_unique" ON "guide_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_guide_posts_published_at" ON "guide_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_guide_posts_auto_generated_created_at" ON "guide_posts" USING btree ("auto_generated","created_at");
