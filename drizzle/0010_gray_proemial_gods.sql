CREATE TABLE `contact_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`content` text NOT NULL,
	`createdBy` int,
	`createdByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`dateOfBirth` varchar(20),
	`address` text,
	`city` varchar(255),
	`state` varchar(255),
	`country` varchar(255),
	`photoUrl` varchar(1000),
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(50),
	`emergencyContactRelation` varchar(100),
	`hireDate` varchar(20) NOT NULL,
	`department` varchar(255),
	`jobTitle` varchar(255) NOT NULL,
	`employmentType` enum('full_time','part_time','contractor','intern') NOT NULL DEFAULT 'full_time',
	`status` enum('active','inactive','terminated','on_leave') NOT NULL DEFAULT 'active',
	`salary` varchar(50),
	`payFrequency` enum('weekly','biweekly','monthly','per_project') DEFAULT 'monthly',
	`currency` varchar(10) DEFAULT 'USD',
	`contactId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`docCategory` enum('contract','id_document','tax_form','certification','onboarding','performance','payslip','invoice','receipt','other') NOT NULL DEFAULT 'other',
	`fileUrl` varchar(1000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(500),
	`mimeType` varchar(100),
	`fileSize` int,
	`notes` text,
	`uploadedBy` int,
	`uploadedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`payPeriodStart` varchar(20) NOT NULL,
	`payPeriodEnd` varchar(20) NOT NULL,
	`amount` varchar(50) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`paymentMethod` enum('bank_transfer','check','crypto','cash','wire','other') NOT NULL DEFAULT 'bank_transfer',
	`paymentDate` varchar(20),
	`payrollStatus` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`receiptUrl` varchar(1000),
	`receiptKey` varchar(500),
	`invoiceUrl` varchar(1000),
	`invoiceKey` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `payroll_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contacts` ADD `category` enum('client','prospect','partner','vendor','other') DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `contacts` ADD `starred` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `rating` int;--> statement-breakpoint
ALTER TABLE `contacts` ADD `photoUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastContactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contact_notes` ADD CONSTRAINT `contact_notes_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_notes` ADD CONSTRAINT `contact_notes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hr_documents` ADD CONSTRAINT `hr_documents_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hr_documents` ADD CONSTRAINT `hr_documents_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cn_contact_idx` ON `contact_notes` (`contactId`);--> statement-breakpoint
CREATE INDEX `emp_email_idx` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `emp_status_idx` ON `employees` (`status`);--> statement-breakpoint
CREATE INDEX `emp_dept_idx` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `hd_employee_idx` ON `hr_documents` (`employeeId`);--> statement-breakpoint
CREATE INDEX `hd_category_idx` ON `hr_documents` (`docCategory`);--> statement-breakpoint
CREATE INDEX `pr_employee_idx` ON `payroll_records` (`employeeId`);--> statement-breakpoint
CREATE INDEX `pr_status_idx` ON `payroll_records` (`payrollStatus`);--> statement-breakpoint
CREATE INDEX `contact_category_idx` ON `contacts` (`category`);--> statement-breakpoint
CREATE INDEX `contact_starred_idx` ON `contacts` (`starred`);