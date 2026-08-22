CREATE TABLE `external_backup_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nutstoreUrl` varchar(1024),
	`nutstoreUsername` varchar(255),
	`cloudflareAccountId` varchar(255),
	`cloudflareKvNamespaceId` varchar(255),
	`cloudflareD1ProxyUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_backup_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_backup_settings_userId_unique` UNIQUE(`userId`)
);
