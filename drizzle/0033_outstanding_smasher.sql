CREATE TABLE `digest_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dgUserId` int NOT NULL,
	`dgAccountId` int,
	`dgDailyEnabled` boolean NOT NULL DEFAULT true,
	`dgWeeklyEnabled` boolean NOT NULL DEFAULT true,
	`dgDailyTime` varchar(10) NOT NULL DEFAULT '08:00',
	`dgWeeklyDay` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL DEFAULT 'monday',
	`dgWeeklyTime` varchar(10) NOT NULL DEFAULT '09:00',
	`dgTimezone` varchar(100) NOT NULL DEFAULT 'America/New_York',
	`dgCrossOrg` boolean NOT NULL DEFAULT true,
	`dgIncMeetings` boolean NOT NULL DEFAULT true,
	`dgIncTasks` boolean NOT NULL DEFAULT true,
	`dgIncContacts` boolean NOT NULL DEFAULT true,
	`dgIncAi` boolean NOT NULL DEFAULT true,
	`dgIncCalendar` boolean NOT NULL DEFAULT true,
	`dgIncKpi` boolean NOT NULL DEFAULT true,
	`dgDelivery` enum('in_app','email','both') NOT NULL DEFAULT 'both',
	`dgLastDaily` timestamp,
	`dgLastWeekly` timestamp,
	`dgCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`dgUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digest_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `dg_user_idx` UNIQUE(`dgUserId`)
);
--> statement-breakpoint
ALTER TABLE `digest_preferences` ADD CONSTRAINT `digest_preferences_dgUserId_users_id_fk` FOREIGN KEY (`dgUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digest_preferences` ADD CONSTRAINT `digest_preferences_dgAccountId_accounts_id_fk` FOREIGN KEY (`dgAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `dg_account_idx` ON `digest_preferences` (`dgAccountId`);