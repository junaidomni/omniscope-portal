CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountName` varchar(500) NOT NULL,
	`accountOwnerUserId` int NOT NULL,
	`accountPlan` enum('starter','professional','enterprise') NOT NULL DEFAULT 'starter',
	`accountStatus` enum('active','suspended','cancelled') NOT NULL DEFAULT 'active',
	`accountMaxOrgs` int NOT NULL DEFAULT 5,
	`accountMaxUsersPerOrg` int NOT NULL DEFAULT 25,
	`accountBillingEmail` varchar(320),
	`accountMetadata` text,
	`accountCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`accountUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`omUserId` int NOT NULL,
	`omOrgId` int NOT NULL,
	`omRole` enum('super_admin','account_owner','org_admin','manager','member','viewer') NOT NULL DEFAULT 'member',
	`omIsDefault` boolean NOT NULL DEFAULT false,
	`omInvitedBy` int,
	`omJoinedAt` timestamp NOT NULL DEFAULT (now()),
	`omUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `om_user_org_idx` UNIQUE(`omUserId`,`omOrgId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgAccountId` int NOT NULL,
	`orgName` varchar(500) NOT NULL,
	`orgSlug` varchar(100) NOT NULL,
	`orgLogoUrl` text,
	`orgAccentColor` varchar(32) DEFAULT '#d4af37',
	`orgIndustry` varchar(255),
	`orgDomain` varchar(500),
	`orgTimezone` varchar(100) DEFAULT 'America/New_York',
	`orgStatus` enum('active','suspended','archived') NOT NULL DEFAULT 'active',
	`orgSettings` text,
	`orgOnboardingCompleted` boolean NOT NULL DEFAULT false,
	`orgCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`orgUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_orgSlug_unique` UNIQUE(`orgSlug`)
);
--> statement-breakpoint
ALTER TABLE `activity_log` ADD `alOrgId` int;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `ceOrgId` int;--> statement-breakpoint
ALTER TABLE `companies` ADD `orgId` int;--> statement-breakpoint
ALTER TABLE `company_aliases` ADD `coaOrgId` int;--> statement-breakpoint
ALTER TABLE `contact_aliases` ADD `caOrgId` int;--> statement-breakpoint
ALTER TABLE `contact_documents` ADD `cdOrgId` int;--> statement-breakpoint
ALTER TABLE `contact_notes` ADD `cnOrgId` int;--> statement-breakpoint
ALTER TABLE `contacts` ADD `contactOrgId` int;--> statement-breakpoint
ALTER TABLE `document_access` ADD `daOrgId` int;--> statement-breakpoint
ALTER TABLE `document_entity_links` ADD `delOrgId` int;--> statement-breakpoint
ALTER TABLE `document_favorites` ADD `dfavOrgId` int;--> statement-breakpoint
ALTER TABLE `document_folders` ADD `dfOrgId` int;--> statement-breakpoint
ALTER TABLE `document_notes` ADD `noteOrgId` int;--> statement-breakpoint
ALTER TABLE `document_templates` ADD `dtOrgId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `docOrgId` int;--> statement-breakpoint
ALTER TABLE `email_company_links` ADD `eclOrgId` int;--> statement-breakpoint
ALTER TABLE `email_entity_links` ADD `eelOrgId` int;--> statement-breakpoint
ALTER TABLE `email_messages` ADD `emOrgId` int;--> statement-breakpoint
ALTER TABLE `email_stars` ADD `esOrgId` int;--> statement-breakpoint
ALTER TABLE `email_thread_summaries` ADD `etsOrgId` int;--> statement-breakpoint
ALTER TABLE `employees` ADD `empOrgId` int;--> statement-breakpoint
ALTER TABLE `feature_toggles` ADD `ftOrgId` int;--> statement-breakpoint
ALTER TABLE `hr_documents` ADD `hrOrgId` int;--> statement-breakpoint
ALTER TABLE `integrations` ADD `intOrgId` int;--> statement-breakpoint
ALTER TABLE `interactions` ADD `intxOrgId` int;--> statement-breakpoint
ALTER TABLE `invitations` ADD `invOrgId` int;--> statement-breakpoint
ALTER TABLE `meeting_categories` ADD `mcOrgId` int;--> statement-breakpoint
ALTER TABLE `meeting_contacts` ADD `mcOrgId` int;--> statement-breakpoint
ALTER TABLE `meeting_tags` ADD `mtOrgId` int;--> statement-breakpoint
ALTER TABLE `meetings` ADD `mtgOrgId` int;--> statement-breakpoint
ALTER TABLE `payroll_records` ADD `prOrgId` int;--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD `psOrgId` int;--> statement-breakpoint
ALTER TABLE `signing_envelopes` ADD `seOrgId` int;--> statement-breakpoint
ALTER TABLE `signing_providers` ADD `spOrgId` int;--> statement-breakpoint
ALTER TABLE `tags` ADD `tagOrgId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `taskOrgId` int;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_accountOwnerUserId_users_id_fk` FOREIGN KEY (`accountOwnerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_memberships` ADD CONSTRAINT `org_memberships_omUserId_users_id_fk` FOREIGN KEY (`omUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_memberships` ADD CONSTRAINT `org_memberships_omOrgId_organizations_id_fk` FOREIGN KEY (`omOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_memberships` ADD CONSTRAINT `org_memberships_omInvitedBy_users_id_fk` FOREIGN KEY (`omInvitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_orgAccountId_accounts_id_fk` FOREIGN KEY (`orgAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_owner_idx` ON `accounts` (`accountOwnerUserId`);--> statement-breakpoint
CREATE INDEX `account_status_idx` ON `accounts` (`accountStatus`);--> statement-breakpoint
CREATE INDEX `om_org_idx` ON `org_memberships` (`omOrgId`);--> statement-breakpoint
CREATE INDEX `om_user_idx` ON `org_memberships` (`omUserId`);--> statement-breakpoint
CREATE INDEX `om_role_idx` ON `org_memberships` (`omRole`);--> statement-breakpoint
CREATE INDEX `org_account_idx` ON `organizations` (`orgAccountId`);--> statement-breakpoint
CREATE INDEX `org_slug_idx` ON `organizations` (`orgSlug`);--> statement-breakpoint
CREATE INDEX `org_status_idx` ON `organizations` (`orgStatus`);--> statement-breakpoint
ALTER TABLE `activity_log` ADD CONSTRAINT `activity_log_alOrgId_organizations_id_fk` FOREIGN KEY (`alOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_ceOrgId_organizations_id_fk` FOREIGN KEY (`ceOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_orgId_organizations_id_fk` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_aliases` ADD CONSTRAINT `company_aliases_coaOrgId_organizations_id_fk` FOREIGN KEY (`coaOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_aliases` ADD CONSTRAINT `contact_aliases_caOrgId_organizations_id_fk` FOREIGN KEY (`caOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_documents` ADD CONSTRAINT `contact_documents_cdOrgId_organizations_id_fk` FOREIGN KEY (`cdOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_notes` ADD CONSTRAINT `contact_notes_cnOrgId_organizations_id_fk` FOREIGN KEY (`cnOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_contactOrgId_organizations_id_fk` FOREIGN KEY (`contactOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_access` ADD CONSTRAINT `document_access_daOrgId_organizations_id_fk` FOREIGN KEY (`daOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_entity_links` ADD CONSTRAINT `document_entity_links_delOrgId_organizations_id_fk` FOREIGN KEY (`delOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_favorites` ADD CONSTRAINT `document_favorites_dfavOrgId_organizations_id_fk` FOREIGN KEY (`dfavOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_folders` ADD CONSTRAINT `document_folders_dfOrgId_organizations_id_fk` FOREIGN KEY (`dfOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_notes` ADD CONSTRAINT `document_notes_noteOrgId_organizations_id_fk` FOREIGN KEY (`noteOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_templates` ADD CONSTRAINT `document_templates_dtOrgId_organizations_id_fk` FOREIGN KEY (`dtOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_docOrgId_organizations_id_fk` FOREIGN KEY (`docOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_company_links` ADD CONSTRAINT `email_company_links_eclOrgId_organizations_id_fk` FOREIGN KEY (`eclOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_entity_links` ADD CONSTRAINT `email_entity_links_eelOrgId_organizations_id_fk` FOREIGN KEY (`eelOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_emOrgId_organizations_id_fk` FOREIGN KEY (`emOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_stars` ADD CONSTRAINT `email_stars_esOrgId_organizations_id_fk` FOREIGN KEY (`esOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_thread_summaries` ADD CONSTRAINT `email_thread_summaries_etsOrgId_organizations_id_fk` FOREIGN KEY (`etsOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_empOrgId_organizations_id_fk` FOREIGN KEY (`empOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feature_toggles` ADD CONSTRAINT `feature_toggles_ftOrgId_organizations_id_fk` FOREIGN KEY (`ftOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hr_documents` ADD CONSTRAINT `hr_documents_hrOrgId_organizations_id_fk` FOREIGN KEY (`hrOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integrations` ADD CONSTRAINT `integrations_intOrgId_organizations_id_fk` FOREIGN KEY (`intOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_intxOrgId_organizations_id_fk` FOREIGN KEY (`intxOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_invOrgId_organizations_id_fk` FOREIGN KEY (`invOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_categories` ADD CONSTRAINT `meeting_categories_mcOrgId_organizations_id_fk` FOREIGN KEY (`mcOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_contacts` ADD CONSTRAINT `meeting_contacts_mcOrgId_organizations_id_fk` FOREIGN KEY (`mcOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_tags` ADD CONSTRAINT `meeting_tags_mtOrgId_organizations_id_fk` FOREIGN KEY (`mtOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_mtgOrgId_organizations_id_fk` FOREIGN KEY (`mtgOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_prOrgId_organizations_id_fk` FOREIGN KEY (`prOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_suggestions` ADD CONSTRAINT `pending_suggestions_psOrgId_organizations_id_fk` FOREIGN KEY (`psOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signing_envelopes` ADD CONSTRAINT `signing_envelopes_seOrgId_organizations_id_fk` FOREIGN KEY (`seOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `signing_providers` ADD CONSTRAINT `signing_providers_spOrgId_organizations_id_fk` FOREIGN KEY (`spOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_tagOrgId_organizations_id_fk` FOREIGN KEY (`tagOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_taskOrgId_organizations_id_fk` FOREIGN KEY (`taskOrgId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;