CREATE TABLE `email_company_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` varchar(255) NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_company_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_stars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`starLevel` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_stars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_company_links` ADD CONSTRAINT `email_company_links_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_company_links` ADD CONSTRAINT `email_company_links_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_stars` ADD CONSTRAINT `email_stars_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ecl_thread_idx` ON `email_company_links` (`threadId`);--> statement-breakpoint
CREATE INDEX `ecl_company_idx` ON `email_company_links` (`companyId`);--> statement-breakpoint
CREATE INDEX `ecl_user_idx` ON `email_company_links` (`userId`);--> statement-breakpoint
CREATE INDEX `es_thread_user_idx` ON `email_stars` (`threadId`,`userId`);--> statement-breakpoint
CREATE INDEX `es_user_idx` ON `email_stars` (`userId`);--> statement-breakpoint
CREATE INDEX `es_star_level_idx` ON `email_stars` (`starLevel`);