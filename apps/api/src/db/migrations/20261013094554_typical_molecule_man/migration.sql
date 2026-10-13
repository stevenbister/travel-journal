ALTER TABLE `entries` ADD `location` text;--> statement-breakpoint
ALTER TABLE `entries` DROP COLUMN `lat`;--> statement-breakpoint
ALTER TABLE `entries` DROP COLUMN `lng`;