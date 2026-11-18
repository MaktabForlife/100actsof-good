CREATE TABLE `acts` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`circle` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`hadith_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hadith_id`) REFERENCES `hadiths`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `acts_team_idx` ON `acts` (`team_id`);--> statement-breakpoint
CREATE TABLE `hadiths` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`circle` text NOT NULL,
	`arabic` text NOT NULL,
	`translation` text NOT NULL,
	`source` text NOT NULL,
	`grading` text DEFAULT '' NOT NULL,
	`inspired` text DEFAULT '' NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hadith_team_idx` ON `hadiths` (`team_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`favourite` text DEFAULT '' NOT NULL,
	`surprise` text DEFAULT '' NOT NULL,
	`learning` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `teams_user_idx` ON `teams` (`user_id`);