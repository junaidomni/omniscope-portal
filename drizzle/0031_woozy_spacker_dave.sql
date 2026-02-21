ALTER TABLE `feature_toggles` DROP INDEX `feature_toggles_ftKey_unique`;--> statement-breakpoint
ALTER TABLE `feature_toggles` ADD CONSTRAINT `ft_org_key_idx` UNIQUE(`ftOrgId`,`ftKey`);