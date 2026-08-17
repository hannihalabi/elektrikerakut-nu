CREATE TABLE "admin_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_credentials_email_unique" ON "admin_credentials" USING btree ("email");
--> statement-breakpoint
CREATE TABLE "admin_password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_password_reset_tokens_token_hash_unique" ON "admin_password_reset_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "idx_admin_password_reset_tokens_email_created_at" ON "admin_password_reset_tokens" USING btree ("email","created_at");
