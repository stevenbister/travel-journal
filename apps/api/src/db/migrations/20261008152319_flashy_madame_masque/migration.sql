PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entries` (
	`id` text PRIMARY KEY,
	`trip_id` text NOT NULL,
	`author_id` text NOT NULL,
	`note` text,
	`entry_date` integer NOT NULL,
	`lat` real,
	`lng` real,
	`tag` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`server_updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_entries_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_entries_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
INSERT INTO `__new_entries`(`id`, `trip_id`, `author_id`, `note`, `entry_date`, `lat`, `lng`, `tag`, `is_deleted`, `created_at`, `updated_at`, `server_updated_at`) SELECT `id`, `trip_id`, `author_id`, `note`, `entry_date`, `lat`, `lng`, `tag`, `is_deleted`, `created_at`, `updated_at`, `server_updated_at` FROM `entries`;--> statement-breakpoint
DROP TABLE `entries`;--> statement-breakpoint
ALTER TABLE `__new_entries` RENAME TO `entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entry_history` (
	`id` text PRIMARY KEY,
	`entry_id` text NOT NULL,
	`edited_by` text NOT NULL,
	`edited_at` integer NOT NULL,
	`server_updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_entry_history_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_entry_history_edited_by_user_id_fk` FOREIGN KEY (`edited_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
INSERT INTO `__new_entry_history`(`id`, `entry_id`, `edited_by`, `edited_at`, `server_updated_at`) SELECT `id`, `entry_id`, `edited_by`, `edited_at`, `server_updated_at` FROM `entry_history`;--> statement-breakpoint
DROP TABLE `entry_history`;--> statement-breakpoint
ALTER TABLE `__new_entry_history` RENAME TO `entry_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
	`server_updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_trips_cover_photo_id_media_id_fk` FOREIGN KEY (`cover_photo_id`) REFERENCES `media`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_trips`(`id`, `title`, `start_date`, `end_date`, `cover_photo_id`, `created_by`, `is_deleted`, `created_at`, `updated_at`, `server_updated_at`) SELECT `id`, `title`, `start_date`, `end_date`, `cover_photo_id`, `created_by`, `is_deleted`, `created_at`, `updated_at`, `server_updated_at` FROM `trips`;--> statement-breakpoint
DROP TABLE `trips`;--> statement-breakpoint
ALTER TABLE `__new_trips` RENAME TO `trips`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `entries_cursor_idx` ON `entries` (`server_updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `entries_trip_date_idx` ON `entries` (`trip_id`,`entry_date`);--> statement-breakpoint
CREATE INDEX `entries_trip_tag_idx` ON `entries` (`trip_id`,`tag`);--> statement-breakpoint
CREATE INDEX `entries_author_idx` ON `entries` (`author_id`);--> statement-breakpoint
CREATE INDEX `entry_history_entry_idx` ON `entry_history` (`entry_id`,`edited_at`);--> statement-breakpoint
CREATE INDEX `entry_history_cursor_idx` ON `entry_history` (`server_updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `trips_cursor_idx` ON `trips` (`server_updated_at`,`id`);