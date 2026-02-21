CREATE TABLE `plan_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pfPlanId` int NOT NULL,
	`pfFeatureKey` varchar(100) NOT NULL,
	`pfIncluded` boolean NOT NULL DEFAULT true,
	CONSTRAINT `plan_features_id` PRIMARY KEY(`id`),
	CONSTRAINT `pf_plan_feature_idx` UNIQUE(`pfPlanId`,`pfFeatureKey`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planKey` varchar(50) NOT NULL,
	`planName` varchar(100) NOT NULL,
	`planDescription` text,
	`planTier` int NOT NULL DEFAULT 0,
	`planPriceMonthly` decimal(10,2),
	`planPriceAnnual` decimal(10,2),
	`planCurrency` varchar(10) NOT NULL DEFAULT 'USD',
	`planMaxOrgs` int NOT NULL DEFAULT 1,
	`planMaxUsersPerOrg` int NOT NULL DEFAULT 5,
	`planMaxContacts` int NOT NULL DEFAULT 500,
	`planMaxMeetingsPerMonth` int NOT NULL DEFAULT 50,
	`planMaxStorageGb` int NOT NULL DEFAULT 5,
	`planIncludesCore` boolean NOT NULL DEFAULT true,
	`planIncludesComm` boolean NOT NULL DEFAULT false,
	`planIncludesIntel` boolean NOT NULL DEFAULT false,
	`planIncludesOps` boolean NOT NULL DEFAULT false,
	`planIncludesExp` boolean NOT NULL DEFAULT false,
	`planHasApi` boolean NOT NULL DEFAULT false,
	`planHasPrioritySupport` boolean NOT NULL DEFAULT false,
	`planHasWhiteLabel` boolean NOT NULL DEFAULT false,
	`planHasDedicatedAccount` boolean NOT NULL DEFAULT false,
	`planHasCustomIntegrations` boolean NOT NULL DEFAULT false,
	`planIsActive` boolean NOT NULL DEFAULT true,
	`planSortOrder` int NOT NULL DEFAULT 0,
	`planCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`planUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_planKey_unique` UNIQUE(`planKey`),
	CONSTRAINT `plan_key_idx` UNIQUE(`planKey`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subAccountId` int NOT NULL,
	`subPlanId` int NOT NULL,
	`subStatus` enum('active','trialing','past_due','cancelled','expired') NOT NULL DEFAULT 'active',
	`subBillingCycle` enum('monthly','annual','custom') NOT NULL DEFAULT 'monthly',
	`subStartDate` timestamp NOT NULL DEFAULT (now()),
	`subEndDate` timestamp,
	`subTrialEndsAt` timestamp,
	`subCancelledAt` timestamp,
	`subStripeCustomerId` varchar(255),
	`subStripeSubId` varchar(255),
	`subOverrideMaxOrgs` int,
	`subOverrideMaxUsers` int,
	`subOverrideMaxContacts` int,
	`subOverrideMaxStorage` int,
	`subNotes` text,
	`subCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`subUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `plan_features` ADD CONSTRAINT `plan_features_pfPlanId_plans_id_fk` FOREIGN KEY (`pfPlanId`) REFERENCES `plans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_subAccountId_accounts_id_fk` FOREIGN KEY (`subAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_subPlanId_plans_id_fk` FOREIGN KEY (`subPlanId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pf_plan_idx` ON `plan_features` (`pfPlanId`);--> statement-breakpoint
CREATE INDEX `plan_tier_idx` ON `plans` (`planTier`);--> statement-breakpoint
CREATE INDEX `sub_account_idx` ON `subscriptions` (`subAccountId`);--> statement-breakpoint
CREATE INDEX `sub_plan_idx` ON `subscriptions` (`subPlanId`);--> statement-breakpoint
CREATE INDEX `sub_status_idx` ON `subscriptions` (`subStatus`);