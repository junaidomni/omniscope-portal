CREATE TABLE `call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clChannelId` int NOT NULL,
	`clInitiatorId` int NOT NULL,
	`clType` enum('voice','video') NOT NULL,
	`clStatus` enum('ringing','ongoing','ended','missed','declined') NOT NULL,
	`clStartedAt` timestamp NOT NULL DEFAULT (now()),
	`clEndedAt` timestamp,
	`clDuration` int,
	`clRecordingUrl` varchar(1000),
	`clTranscriptUrl` varchar(1000),
	`clMeetingId` int,
	CONSTRAINT `call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpCallId` int NOT NULL,
	`cpUserId` int NOT NULL,
	`cpJoinedAt` timestamp NOT NULL DEFAULT (now()),
	`cpLeftAt` timestamp,
	CONSTRAINT `call_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channel_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ciChannelId` int NOT NULL,
	`ciToken` varchar(64) NOT NULL,
	`ciCreatedBy` int NOT NULL,
	`ciExpiresAt` timestamp,
	`ciMaxUses` int,
	`ciUsedCount` int NOT NULL DEFAULT 0,
	`ciIsActive` boolean NOT NULL DEFAULT true,
	`ciCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_invites_ciToken_unique` UNIQUE(`ciToken`)
);
--> statement-breakpoint
CREATE TABLE `channel_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cmChannelId` int NOT NULL,
	`cmUserId` int NOT NULL,
	`cmRole` enum('owner','admin','member','guest') NOT NULL DEFAULT 'member',
	`cmIsGuest` boolean NOT NULL DEFAULT false,
	`cmJoinedAt` timestamp NOT NULL DEFAULT (now()),
	`cmLastReadAt` timestamp,
	`cmIsMuted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `channel_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `cm_channel_user_idx` UNIQUE(`cmChannelId`,`cmUserId`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelOrgId` int,
	`channelType` enum('dm','group','deal_room','announcement') NOT NULL,
	`channelName` varchar(500),
	`channelDescription` text,
	`channelAvatar` varchar(1000),
	`channelIsPinned` boolean NOT NULL DEFAULT false,
	`channelIsArchived` boolean NOT NULL DEFAULT false,
	`channelCreatedBy` int NOT NULL,
	`channelCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`channelUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`channelLastMessageAt` timestamp,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`maMessageId` int NOT NULL,
	`maFileUrl` varchar(1000) NOT NULL,
	`maFileName` varchar(500) NOT NULL,
	`maFileSize` int NOT NULL,
	`maMimeType` varchar(100) NOT NULL,
	`maThumbnailUrl` varchar(1000),
	`maCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mrMessageId` int NOT NULL,
	`mrUserId` int NOT NULL,
	`mrEmoji` varchar(50) NOT NULL,
	`mrCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `mr_msg_user_emoji_idx` UNIQUE(`mrMessageId`,`mrUserId`,`mrEmoji`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`msgChannelId` int NOT NULL,
	`msgUserId` int NOT NULL,
	`msgContent` text NOT NULL,
	`msgType` enum('text','file','system','call') NOT NULL DEFAULT 'text',
	`msgReplyToId` int,
	`msgLinkedMeetingId` int,
	`msgLinkedContactId` int,
	`msgLinkedTaskId` int,
	`msgIsPinned` boolean NOT NULL DEFAULT false,
	`msgIsEdited` boolean NOT NULL DEFAULT false,
	`msgIsDeleted` boolean NOT NULL DEFAULT false,
	`msgCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`msgEditedAt` timestamp,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `typing_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tiChannelId` int NOT NULL,
	`tiUserId` int NOT NULL,
	`tiStartedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `typing_indicators_id` PRIMARY KEY(`id`),
	CONSTRAINT `ti_channel_user_idx` UNIQUE(`tiChannelId`,`tiUserId`)
);
--> statement-breakpoint
CREATE TABLE `user_presence` (
	`upUserId` int NOT NULL,
	`upStatus` enum('online','away','offline') NOT NULL DEFAULT 'offline',
	`upLastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_presence_upUserId` PRIMARY KEY(`upUserId`)
);
--> statement-breakpoint
ALTER TABLE `call_logs` ADD CONSTRAINT `call_logs_clChannelId_channels_id_fk` FOREIGN KEY (`clChannelId`) REFERENCES `channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_logs` ADD CONSTRAINT `call_logs_clInitiatorId_users_id_fk` FOREIGN KEY (`clInitiatorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_logs` ADD CONSTRAINT `call_logs_clMeetingId_meetings_id_fk` FOREIGN KEY (`clMeetingId`) REFERENCES `meetings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_participants` ADD CONSTRAINT `call_participants_cpCallId_call_logs_id_fk` FOREIGN KEY (`cpCallId`) REFERENCES `call_logs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_participants` ADD CONSTRAINT `call_participants_cpUserId_users_id_fk` FOREIGN KEY (`cpUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_invites` ADD CONSTRAINT `channel_invites_ciChannelId_channels_id_fk` FOREIGN KEY (`ciChannelId`) REFERENCES `channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_invites` ADD CONSTRAINT `channel_invites_ciCreatedBy_users_id_fk` FOREIGN KEY (`ciCreatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_members` ADD CONSTRAINT `channel_members_cmChannelId_channels_id_fk` FOREIGN KEY (`cmChannelId`) REFERENCES `channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_members` ADD CONSTRAINT `channel_members_cmUserId_users_id_fk` FOREIGN KEY (`cmUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channels` ADD CONSTRAINT `channels_channelOrgId_organizations_id_fk` FOREIGN KEY (`channelOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channels` ADD CONSTRAINT `channels_channelCreatedBy_users_id_fk` FOREIGN KEY (`channelCreatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_maMessageId_messages_id_fk` FOREIGN KEY (`maMessageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_mrMessageId_messages_id_fk` FOREIGN KEY (`mrMessageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_mrUserId_users_id_fk` FOREIGN KEY (`mrUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_msgChannelId_channels_id_fk` FOREIGN KEY (`msgChannelId`) REFERENCES `channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_msgUserId_users_id_fk` FOREIGN KEY (`msgUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_msgReplyToId_messages_id_fk` FOREIGN KEY (`msgReplyToId`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_msgLinkedMeetingId_meetings_id_fk` FOREIGN KEY (`msgLinkedMeetingId`) REFERENCES `meetings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_msgLinkedContactId_contacts_id_fk` FOREIGN KEY (`msgLinkedContactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_msgLinkedTaskId_tasks_id_fk` FOREIGN KEY (`msgLinkedTaskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `typing_indicators` ADD CONSTRAINT `typing_indicators_tiChannelId_channels_id_fk` FOREIGN KEY (`tiChannelId`) REFERENCES `channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `typing_indicators` ADD CONSTRAINT `typing_indicators_tiUserId_users_id_fk` FOREIGN KEY (`tiUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_presence` ADD CONSTRAINT `user_presence_upUserId_users_id_fk` FOREIGN KEY (`upUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cl_channel_idx` ON `call_logs` (`clChannelId`);--> statement-breakpoint
CREATE INDEX `cl_initiator_idx` ON `call_logs` (`clInitiatorId`);--> statement-breakpoint
CREATE INDEX `cl_started_at_idx` ON `call_logs` (`clStartedAt`);--> statement-breakpoint
CREATE INDEX `cp_call_idx` ON `call_participants` (`cpCallId`);--> statement-breakpoint
CREATE INDEX `cp_user_idx` ON `call_participants` (`cpUserId`);--> statement-breakpoint
CREATE INDEX `ci_token_idx` ON `channel_invites` (`ciToken`);--> statement-breakpoint
CREATE INDEX `ci_channel_idx` ON `channel_invites` (`ciChannelId`);--> statement-breakpoint
CREATE INDEX `cm_channel_idx` ON `channel_members` (`cmChannelId`);--> statement-breakpoint
CREATE INDEX `cm_user_idx` ON `channel_members` (`cmUserId`);--> statement-breakpoint
CREATE INDEX `channel_org_idx` ON `channels` (`channelOrgId`);--> statement-breakpoint
CREATE INDEX `channel_type_idx` ON `channels` (`channelType`);--> statement-breakpoint
CREATE INDEX `channel_created_by_idx` ON `channels` (`channelCreatedBy`);--> statement-breakpoint
CREATE INDEX `ma_message_idx` ON `message_attachments` (`maMessageId`);--> statement-breakpoint
CREATE INDEX `mr_message_idx` ON `message_reactions` (`mrMessageId`);--> statement-breakpoint
CREATE INDEX `msg_channel_idx` ON `messages` (`msgChannelId`);--> statement-breakpoint
CREATE INDEX `msg_user_idx` ON `messages` (`msgUserId`);--> statement-breakpoint
CREATE INDEX `msg_created_at_idx` ON `messages` (`msgCreatedAt`);--> statement-breakpoint
CREATE INDEX `ti_channel_idx` ON `typing_indicators` (`tiChannelId`);