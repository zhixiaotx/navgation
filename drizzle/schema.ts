import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Metadata for JSON files stored in managed object storage. The JSON bytes live
 * in storage; this table only keeps the owner and the key needed to retrieve it.
 */
export const bookmarkBackups = mysqlTable(
  "bookmark_backups",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    source: mysqlEnum("source", ["import", "snapshot"]).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    bookmarkCount: int("bookmarkCount").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("bookmark_backups_user_created_idx").on(table.userId, table.createdAt)],
);

/**
 * User-editable connection metadata for external backups. Passwords, API tokens
 * and Worker proxy tokens are deliberately excluded and stay server-side only.
 */
export const externalBackupSettings = mysqlTable("external_backup_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nutstoreUrl: varchar("nutstoreUrl", { length: 1024 }),
  nutstoreUsername: varchar("nutstoreUsername", { length: 255 }),
  cloudflareAccountId: varchar("cloudflareAccountId", { length: 255 }),
  cloudflareKvNamespaceId: varchar("cloudflareKvNamespaceId", { length: 255 }),
  cloudflareD1ProxyUrl: varchar("cloudflareD1ProxyUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BookmarkBackup = typeof bookmarkBackups.$inferSelect;
export type InsertBookmarkBackup = typeof bookmarkBackups.$inferInsert;
export type ExternalBackupSettings = typeof externalBackupSettings.$inferSelect;
export type InsertExternalBackupSettings = typeof externalBackupSettings.$inferInsert;
