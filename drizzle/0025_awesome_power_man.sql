ALTER TABLE `document_access` MODIFY COLUMN `daUserId` int;--> statement-breakpoint
ALTER TABLE `document_access` ADD `daContactId` int;--> statement-breakpoint
ALTER TABLE `document_access` ADD `daCompanyId` int;--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daContactId_contacts_id_fk` FOREIGN KEY (`daContactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daCompanyId_companies_id_fk` FOREIGN KEY (`daCompanyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `da_contact_idx` ON `document_access` (`daContactId`);--> statement-breakpoint
CREATE INDEX `da_company_idx` ON `document_access` (`daCompanyId`);