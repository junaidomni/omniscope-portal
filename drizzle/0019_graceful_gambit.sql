ALTER TABLE `tasks` ADD `assigneeContactId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `sourceThreadId` varchar(255);--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assigneeContactId_contacts_id_fk` FOREIGN KEY (`assigneeContactId`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;