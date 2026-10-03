ALTER TABLE `entry_history` RENAME COLUMN `updated_at` TO `edited_at`;--> statement-breakpoint
ALTER TABLE `entry_history` ADD `server_updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entry_history` (
	`id` text PRIMARY KEY,
	`entry_id` text NOT NULL,
	`edited_by` text NOT NULL,
	`edited_at` integer NOT NULL,
	`server_updated_at` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_entry_history_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_entry_history_edited_by_user_id_fk` FOREIGN KEY (`edited_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
INSERT INTO `__new_entry_history`(`id`, `entry_id`, `edited_by`, `edited_at`) SELECT `id`, `entry_id`, `edited_by`, `edited_at` FROM `entry_history`;--> statement-breakpoint
DROP TABLE `entry_history`;--> statement-breakpoint
ALTER TABLE `__new_entry_history` RENAME TO `entry_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `entry_history_entry_idx` ON `entry_history` (`entry_id`,`edited_at`);--> statement-breakpoint
CREATE INDEX `entry_history_cursor_idx` ON `entry_history` (`server_updated_at`,`id`);