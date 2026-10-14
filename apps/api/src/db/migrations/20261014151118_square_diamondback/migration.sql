ALTER TABLE `entries` RENAME COLUMN `note` TO `title`;--> statement-breakpoint
ALTER TABLE `entries` ADD `notes` text;