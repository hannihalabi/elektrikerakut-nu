CREATE TABLE `partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`legal_name` text NOT NULL,
	`organization_number` text NOT NULL,
	`contact_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`website` text,
	`service_areas` text NOT NULL,
	`capabilities` text NOT NULL,
	`availability` text NOT NULL,
	`notes` text,
	`source` text DEFAULT 'SELF_SERVICE' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`registration_verified_at` integer,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_public_id_unique` ON `partners` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `partners_organization_number_unique` ON `partners` (`organization_number`);--> statement-breakpoint
CREATE INDEX `idx_partners_status_created_at` ON `partners` (`status`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
