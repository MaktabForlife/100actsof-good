CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_unique` ON `accounts` (`username`);--> statement-breakpoint
CREATE TABLE `auth_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
ALTER TABLE `acts` ADD `number` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `acts` ADD `how_lived` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `acts` ADD `hadith_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `acts` ADD `hadith_reference` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `members` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `class_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `started_on` text DEFAULT '' NOT NULL;