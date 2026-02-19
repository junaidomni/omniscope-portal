CREATE TABLE `document_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`daDocumentId` int,
	`daFolderId` int,
	`daUserId` int NOT NULL,
	`daAccessLevel` enum('view','edit','admin') NOT NULL DEFAULT 'view',
	`daGrantedBy` int,
	`daCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_entity_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`delDocumentId` int NOT NULL,
	`delEntityType` enum('company','contact','meeting') NOT NULL,
	`delEntityId` int NOT NULL,
	`delLinkType` enum('primary','related','mentioned','generated_for','signed_by') NOT NULL DEFAULT 'primary',
	`delCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_entity_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dfUserId` int NOT NULL,
	`dfDocumentId` int NOT NULL,
	`dfCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `df_user_doc_idx` UNIQUE(`dfUserId`,`dfDocumentId`)
);
--> statement-breakpoint
CREATE TABLE `document_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(500) NOT NULL,
	`parentId` int,
	`folderCollection` enum('company_repo','personal','counterparty','templates','signed','transactions') NOT NULL,
	`ownerId` int,
	`folderEntityType` enum('company','contact'),
	`folderEntityId` int,
	`googleFolderId` varchar(500),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dtName` varchar(500) NOT NULL,
	`dtDescription` text,
	`dtCategory` enum('agreement','compliance','intake','profile','other') NOT NULL DEFAULT 'agreement',
	`dtSubcategory` varchar(255),
	`dtGoogleFileId` varchar(500),
	`dtS3Url` varchar(1000),
	`dtMergeFieldSchema` text,
	`dtDefaultRecipientRoles` text,
	`dtVersion` int NOT NULL DEFAULT 1,
	`dtIsActive` boolean NOT NULL DEFAULT true,
	`dtTimesUsed` int NOT NULL DEFAULT 0,
	`dtCreatedBy` int,
	`dtCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`dtUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docTitle` varchar(1000) NOT NULL,
	`docDescription` text,
	`docSourceType` enum('google_doc','google_sheet','google_slide','pdf','uploaded','generated') NOT NULL,
	`googleFileId` varchar(500),
	`googleMimeType` varchar(255),
	`docS3Url` varchar(1000),
	`docS3Key` varchar(500),
	`docFileName` varchar(500),
	`docMimeType` varchar(255),
	`docCollection` enum('company_repo','personal','counterparty','template','transaction','signed') NOT NULL DEFAULT 'company_repo',
	`docCategory2` enum('agreement','compliance','intake','profile','strategy','operations','transaction','correspondence','template','other') NOT NULL DEFAULT 'other',
	`docSubcategory` varchar(255),
	`docStatus` enum('draft','active','pending_signature','sent','viewed','signed','voided','declined','archived') NOT NULL DEFAULT 'active',
	`docVisibility` enum('organization','team','private','restricted') NOT NULL DEFAULT 'organization',
	`docFolderId` int,
	`docOwnerId` int,
	`isTemplate` boolean NOT NULL DEFAULT false,
	`docFileSize` int,
	`docAiSummary` text,
	`docAiEntities` text,
	`docLastSyncedAt` timestamp,
	`docGoogleModifiedAt` timestamp,
	`docCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`docUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signing_envelopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seDocumentId` int NOT NULL,
	`seProviderId` int NOT NULL,
	`seProviderEnvelopeId` varchar(500),
	`seStatus` enum('draft','sent','viewed','completed','declined','voided','expired') NOT NULL DEFAULT 'draft',
	`seRecipients` text,
	`seSentAt` timestamp,
	`seCompletedAt` timestamp,
	`seSignedDocUrl` varchar(1000),
	`seSignedDocKey` varchar(500),
	`seMetadata` text,
	`seCreatedBy` int,
	`seCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`seUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signing_envelopes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signing_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spProvider` enum('firma','signatureapi','docuseal','pandadocs','docusign','boldsign','esignly') NOT NULL,
	`spDisplayName` varchar(255) NOT NULL,
	`spIsActive` boolean NOT NULL DEFAULT false,
	`spIsDefault` boolean NOT NULL DEFAULT false,
	`spApiKey` text,
	`spApiSecret` text,
	`spBaseUrl` varchar(500),
	`spWebhookSecret` varchar(500),
	`spConfig` text,
	`spCreatedBy` int,
	`spCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`spUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signing_providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daDocumentId_documents_id_fk` FOREIGN KEY (`daDocumentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daFolderId_document_folders_id_fk` FOREIGN KEY (`daFolderId`) REFERENCES `document_folders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daUserId_users_id_fk` FOREIGN KEY (`daUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daGrantedBy_users_id_fk` FOREIGN KEY (`daGrantedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_entity_links` ADD CONSTRAINT `document_entity_links_delDocumentId_documents_id_fk` FOREIGN KEY (`delDocumentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_favorites` ADD CONSTRAINT `document_favorites_dfUserId_users_id_fk` FOREIGN KEY (`dfUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_favorites` ADD CONSTRAINT `document_favorites_dfDocumentId_documents_id_fk` FOREIGN KEY (`dfDocumentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_folders` ADD CONSTRAINT `document_folders_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_templates` ADD CONSTRAINT `document_templates_dtCreatedBy_users_id_fk` FOREIGN KEY (`dtCreatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_docFolderId_document_folders_id_fk` FOREIGN KEY (`docFolderId`) REFERENCES `document_folders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_docOwnerId_users_id_fk` FOREIGN KEY (`docOwnerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signing_envelopes` ADD CONSTRAINT `signing_envelopes_seDocumentId_documents_id_fk` FOREIGN KEY (`seDocumentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signing_envelopes` ADD CONSTRAINT `signing_envelopes_seProviderId_signing_providers_id_fk` FOREIGN KEY (`seProviderId`) REFERENCES `signing_providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signing_envelopes` ADD CONSTRAINT `signing_envelopes_seCreatedBy_users_id_fk` FOREIGN KEY (`seCreatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signing_providers` ADD CONSTRAINT `signing_providers_spCreatedBy_users_id_fk` FOREIGN KEY (`spCreatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `da_document_idx` ON `document_access` (`daDocumentId`);--> statement-breakpoint
CREATE INDEX `da_folder_idx` ON `document_access` (`daFolderId`);--> statement-breakpoint
CREATE INDEX `da_user_idx` ON `document_access` (`daUserId`);--> statement-breakpoint
CREATE INDEX `del_document_idx` ON `document_entity_links` (`delDocumentId`);--> statement-breakpoint
CREATE INDEX `del_entity_idx` ON `document_entity_links` (`delEntityType`,`delEntityId`);--> statement-breakpoint
CREATE INDEX `del_doc_entity_idx` ON `document_entity_links` (`delDocumentId`,`delEntityType`,`delEntityId`);--> statement-breakpoint
CREATE INDEX `df_parent_idx` ON `document_folders` (`parentId`);--> statement-breakpoint
CREATE INDEX `df_collection_idx` ON `document_folders` (`folderCollection`);--> statement-breakpoint
CREATE INDEX `df_owner_idx` ON `document_folders` (`ownerId`);--> statement-breakpoint
CREATE INDEX `df_entity_idx` ON `document_folders` (`folderEntityType`,`folderEntityId`);--> statement-breakpoint
CREATE INDEX `dt_name_idx` ON `document_templates` (`dtName`);--> statement-breakpoint
CREATE INDEX `dt_category_idx` ON `document_templates` (`dtCategory`);--> statement-breakpoint
CREATE INDEX `dt_active_idx` ON `document_templates` (`dtIsActive`);--> statement-breakpoint
CREATE INDEX `doc_title_idx` ON `documents` (`docTitle`);--> statement-breakpoint
CREATE INDEX `doc_collection_idx` ON `documents` (`docCollection`);--> statement-breakpoint
CREATE INDEX `doc_category_idx` ON `documents` (`docCategory2`);--> statement-breakpoint
CREATE INDEX `doc_status_idx` ON `documents` (`docStatus`);--> statement-breakpoint
CREATE INDEX `doc_owner_idx` ON `documents` (`docOwnerId`);--> statement-breakpoint
CREATE INDEX `doc_folder_idx` ON `documents` (`docFolderId`);--> statement-breakpoint
CREATE INDEX `doc_template_idx` ON `documents` (`isTemplate`);--> statement-breakpoint
CREATE INDEX `doc_google_file_idx` ON `documents` (`googleFileId`);--> statement-breakpoint
CREATE INDEX `se_document_idx` ON `signing_envelopes` (`seDocumentId`);--> statement-breakpoint
CREATE INDEX `se_provider_idx` ON `signing_envelopes` (`seProviderId`);--> statement-breakpoint
CREATE INDEX `se_status_idx` ON `signing_envelopes` (`seStatus`);--> statement-breakpoint
CREATE INDEX `se_provider_envelope_idx` ON `signing_envelopes` (`seProviderEnvelopeId`);--> statement-breakpoint
CREATE INDEX `sp_provider_idx` ON `signing_providers` (`spProvider`);--> statement-breakpoint
CREATE INDEX `sp_active_idx` ON `signing_providers` (`spIsActive`);--> statement-breakpoint
CREATE INDEX `sp_default_idx` ON `signing_providers` (`spIsDefault`);