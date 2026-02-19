CREATE TABLE `company_aliases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`companyAliasName` varchar(500) NOT NULL,
	`companyAliasSource` varchar(100) NOT NULL DEFAULT 'merge',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_aliases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_aliases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int NOT NULL,
	`aliasName` varchar(500) NOT NULL,
	`aliasEmail` varchar(500),
	`aliasSource` varchar(100) NOT NULL DEFAULT 'merge',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_aliases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `calias_user_company_idx` ON `company_aliases` (`userId`,`companyId`);--> statement-breakpoint
CREATE INDEX `calias_name_idx` ON `company_aliases` (`userId`,`companyAliasName`);--> statement-breakpoint
CREATE INDEX `alias_user_contact_idx` ON `contact_aliases` (`userId`,`contactId`);--> statement-breakpoint
CREATE INDEX `alias_name_idx` ON `contact_aliases` (`userId`,`aliasName`);--> statement-breakpoint
CREATE INDEX `alias_email_idx` ON `contact_aliases` (`userId`,`aliasEmail`);