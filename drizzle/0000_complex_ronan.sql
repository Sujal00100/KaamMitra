CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`salary` text,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'OPEN',
	`created_at` integer DEFAULT '"2025-04-04T12:45:19.292Z"' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`password` text,
	`role` text DEFAULT 'USER',
	`created_at` integer DEFAULT '"2025-04-04T12:45:19.291Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);