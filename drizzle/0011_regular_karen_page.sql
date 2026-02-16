CREATE TABLE `contact_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`contactDocCategory` enum('ncnda','contract','agreement','proposal','invoice','kyc','compliance','correspondence','other') NOT NULL DEFAULT 'other',
	`fileUrl` varchar(1000) NOT NULL,
	`fileKey` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`uploadedBy` int,
	CONSTRAINT `contact_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contact_documents` ADD CONSTRAINT `contact_documents_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_documents` ADD CONSTRAINT `contact_documents_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cd_contact_idx` ON `contact_documents` (`contactId`);--> statement-breakpoint
CREATE INDEX `cd_category_idx` ON `contact_documents` (`contactDocCategory`);