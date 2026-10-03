ALTER TABLE `entries` ADD `server_updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `is_deleted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `server_updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_trips` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`cover_photo_id` text,
	`created_by` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`server_updated_at` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_trips_cover_photo_id_media_id_fk` FOREIGN KEY (`cover_photo_id`) REFERENCES `media`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_trips`(`id`, `title`, `start_date`, `end_date`, `cover_photo_id`, `created_by`, `created_at`, `updated_at`) SELECT `id`, `title`, `start_date`, `end_date`, `cover_photo_id`, `created_by`, `created_at`, `updated_at` FROM `trips`;--> statement-breakpoint
DROP TABLE `trips`;--> statement-breakpoint
ALTER TABLE `__new_trips` RENAME TO `trips`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `entries_trip_updated_idx`;--> statement-breakpoint
CREATE INDEX `trips_cursor_idx` ON `trips` (`server_updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `entries_cursor_idx` ON `entries` (`server_updated_at`,`id`);