CREATE TABLE `files` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`blob_name` varchar(512) NOT NULL,
	`content_type` varchar(127) NOT NULL,
	`size_bytes` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`),
	CONSTRAINT `files_blob_name_unique` UNIQUE(`blob_name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;