CREATE TABLE `google_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenType` varchar(50) NOT NULL DEFAULT 'Bearer',
	`scope` text,
	`expiresAt` timestamp,
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `google_tokens` ADD CONSTRAINT `google_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `google_token_user_idx` ON `google_tokens` (`userId`);