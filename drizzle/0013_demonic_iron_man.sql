ALTER TABLE `companies` ADD `companyApprovalStatus` enum('approved','pending','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `companyLocation` varchar(500);--> statement-breakpoint
ALTER TABLE `companies` ADD `internalRating` int;--> statement-breakpoint
ALTER TABLE `companies` ADD `jurisdictionRisk` enum('low','medium','high','critical');--> statement-breakpoint
ALTER TABLE `companies` ADD `bankingPartner` varchar(500);--> statement-breakpoint
ALTER TABLE `companies` ADD `custodian` varchar(500);--> statement-breakpoint
ALTER TABLE `companies` ADD `regulatoryExposure` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `entityType` enum('sovereign','private','institutional','family_office','other');--> statement-breakpoint
ALTER TABLE `contacts` ADD `contactApprovalStatus` enum('approved','pending','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `riskTier` enum('low','medium','high','critical');--> statement-breakpoint
ALTER TABLE `contacts` ADD `complianceStage` enum('not_started','in_progress','cleared','flagged');--> statement-breakpoint
ALTER TABLE `contacts` ADD `influenceWeight` enum('decision_maker','influencer','gatekeeper','champion','end_user');--> statement-breakpoint
ALTER TABLE `contacts` ADD `introducerSource` varchar(500);--> statement-breakpoint
ALTER TABLE `contacts` ADD `referralChain` text;--> statement-breakpoint
CREATE INDEX `company_approval_idx` ON `companies` (`companyApprovalStatus`);--> statement-breakpoint
CREATE INDEX `contact_approval_idx` ON `contacts` (`contactApprovalStatus`);