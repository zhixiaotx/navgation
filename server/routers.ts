import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  buildBookmarkBackupKey,
  BOOKMARK_JSON_CONTENT_TYPE,
  inspectBookmarkJson,
  normalizeBackupFileName,
} from "./bookmarkBackups";
import { getExternalBackupStatus, saveExternalBackup } from "./externalBackups";
import {
  createBookmarkBackup,
  getBookmarkBackupForUser,
  listBookmarkBackups,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageGet, storagePut } from "./storage";

const backupIdInput = z.object({ id: z.number().int().positive() });
const saveBookmarkBackupInput = z.object({
  fileName: z.string().trim().min(1).max(255),
  content: z.string().min(2).max(5 * 1024 * 1024),
  source: z.enum(["import", "snapshot"]),
});
const saveExternalBackupInput = z.object({
  target: z.enum(["nutstore", "cloudflare_kv", "cloudflare_d1"]),
  fileName: z.string().trim().min(1).max(255),
  content: z.string().min(2).max(5 * 1024 * 1024),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  bookmarkBackups: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return listBookmarkBackups(ctx.user.id);
    }),
    save: protectedProcedure.input(saveBookmarkBackupInput).mutation(async ({ ctx, input }) => {
      const { bookmarkCount } = inspectBookmarkJson(input.content);
      const fileName = normalizeBackupFileName(input.fileName);
      const { key } = await storagePut(
        buildBookmarkBackupKey(ctx.user.id, fileName),
        input.content,
        BOOKMARK_JSON_CONTENT_TYPE,
      );
      const id = await createBookmarkBackup({
        userId: ctx.user.id,
        storageKey: key,
        fileName,
        source: input.source,
        sizeBytes: new TextEncoder().encode(input.content).byteLength,
        bookmarkCount,
      });
      return { id, fileName, bookmarkCount, source: input.source };
    }),
    access: protectedProcedure.input(backupIdInput).mutation(async ({ ctx, input }) => {
      const backup = await getBookmarkBackupForUser(input.id, ctx.user.id);
      if (!backup) throw new Error("未找到该云端备份，或你没有访问权限。");
      const { url } = await storageGet(backup.storageKey);
      return {
        id: backup.id,
        fileName: backup.fileName,
        bookmarkCount: backup.bookmarkCount,
        source: backup.source,
        url,
      };
    }),
  }),
  externalBackups: router({
    status: protectedProcedure.query(() => getExternalBackupStatus()),
    save: protectedProcedure.input(saveExternalBackupInput).mutation(async ({ ctx, input }) => {
      const { bookmarkCount } = inspectBookmarkJson(input.content);
      return saveExternalBackup(input.target, {
        userId: ctx.user.id,
        fileName: normalizeBackupFileName(input.fileName),
        content: input.content,
        bookmarkCount,
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
