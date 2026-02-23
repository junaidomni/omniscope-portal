CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`psUserId` int NOT NULL,
	`psEndpoint` text NOT NULL,
	`psP256dh` text NOT NULL,
	`psAuth` text NOT NULL,
	`psCreatedAt` bigint NOT NULL,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_psUserId_users_id_fk` FOREIGN KEY (`psUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ps_user_idx` ON `push_subscriptions` (`psUserId`);