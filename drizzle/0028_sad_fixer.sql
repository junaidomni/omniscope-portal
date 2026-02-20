CREATE TABLE `design_preferences` (
	`dpId` int AUTO_INCREMENT NOT NULL,
	`dpUserId` int NOT NULL,
	`dpTheme` enum('obsidian','ivory','midnight','emerald','slate') NOT NULL DEFAULT 'obsidian',
	`dpAccentColor` varchar(32) NOT NULL DEFAULT '#d4af37',
	`dpLogoUrl` text,
	`dpSidebarStyle` enum('default','compact','minimal') NOT NULL DEFAULT 'default',
	`dpSidebarPosition` enum('left','right') NOT NULL DEFAULT 'left',
	`dpFontFamily` varchar(64) NOT NULL DEFAULT 'Inter',
	`dpUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_preferences_dpId` PRIMARY KEY(`dpId`),
	CONSTRAINT `dp_user_idx` UNIQUE(`dpUserId`)
);
--> statement-breakpoint
ALTER TABLE `design_preferences` ADD CONSTRAINT `design_preferences_dpUserId_users_id_fk` FOREIGN KEY (`dpUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;