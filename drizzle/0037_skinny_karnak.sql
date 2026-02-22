CREATE TABLE `login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loginAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	`loginMethod` varchar(64),
	`success` boolean NOT NULL DEFAULT true,
	`failureReason` varchar(255),
	`country` varchar(100),
	`city` varchar(100),
	`deviceType` varchar(50),
	CONSTRAINT `login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `login_history` ADD CONSTRAINT `login_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lh_user_idx` ON `login_history` (`userId`);--> statement-breakpoint
CREATE INDEX `lh_login_at_idx` ON `login_history` (`loginAt`);