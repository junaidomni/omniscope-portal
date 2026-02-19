CREATE TABLE `pending_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suggestionType` enum('company_link','enrichment','company_enrichment') NOT NULL,
	`suggestionStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`contactId` int,
	`companyId` int,
	`suggestedCompanyId` int,
	`suggestedData` text,
	`reason` text,
	`sourceMeetingId` int,
	`confidence` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	CONSTRAINT `pending_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD CONSTRAINT `pending_suggestions_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD CONSTRAINT `pending_suggestions_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD CONSTRAINT `pending_suggestions_suggestedCompanyId_companies_id_fk` FOREIGN KEY (`suggestedCompanyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD CONSTRAINT `pending_suggestions_sourceMeetingId_meetings_id_fk` FOREIGN KEY (`sourceMeetingId`) REFERENCES `meetings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD CONSTRAINT `pending_suggestions_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ps_type_idx` ON `pending_suggestions` (`suggestionType`);--> statement-breakpoint
CREATE INDEX `ps_status_idx` ON `pending_suggestions` (`suggestionStatus`);--> statement-breakpoint
CREATE INDEX `ps_contact_idx` ON `pending_suggestions` (`contactId`);--> statement-breakpoint
CREATE INDEX `ps_company_idx` ON `pending_suggestions` (`companyId`);