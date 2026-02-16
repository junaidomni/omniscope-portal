CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`invitedBy` int,
	`acceptedAt` timestamp,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `meeting_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meeting_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_invitedBy_users_id_fk` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_categories` ADD CONSTRAINT `meeting_categories_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE INDEX `mc_cat_meeting_idx` ON `meeting_categories` (`meetingId`);--> statement-breakpoint
CREATE INDEX `mc_cat_category_idx` ON `meeting_categories` (`category`);