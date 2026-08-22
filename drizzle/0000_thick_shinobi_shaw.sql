CREATE TABLE `bookmark_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`source` enum('import','snapshot') NOT NULL,
	`sizeBytes` int NOT NULL,
	`bookmarkCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmark_backups_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookmark_backups_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE INDEX `bookmark_backups_user_created_idx` ON `bookmark_backups` (`userId`,`createdAt`);
