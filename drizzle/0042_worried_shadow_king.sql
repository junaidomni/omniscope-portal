ALTER TABLE `call_participants` DROP FOREIGN KEY `call_participants_cpUserId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `call_participants` ADD `cpRole` enum('host','participant') DEFAULT 'participant' NOT NULL;--> statement-breakpoint
ALTER TABLE `call_participants` ADD `cpAudioEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `call_participants` ADD `cpVideoEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `call_participants` ADD CONSTRAINT `call_participants_cpUserId_users_id_fk` FOREIGN KEY (`cpUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;