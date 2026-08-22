import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createBookmarkBackup: vi.fn(),
  getBookmarkBackupForUser: vi.fn(),
  listBookmarkBackups: vi.fn(),
  storageGet: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./db", () => ({
  createBookmarkBackup: mocks.createBookmarkBackup,
  getBookmarkBackupForUser: mocks.getBookmarkBackupForUser,
  listBookmarkBackups: mocks.listBookmarkBackups,
}));

vi.mock("./storage", () => ({
  storageGet: mocks.storageGet,
  storagePut: mocks.storagePut,
}));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "bookmark-owner",
      name: "书签用户",
      email: null,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date("2026-08-22T00:00:00.000Z"),
      updatedAt: new Date("2026-08-22T00:00:00.000Z"),
      lastSignedIn: new Date("2026-08-22T00:00:00.000Z"),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("bookmarkBackups router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves validated JSON to object storage and persists only metadata", async () => {
    mocks.storagePut.mockResolvedValue({
      key: "bookmark-backups/7/2026-08-22T00-00-00-000Z-imported.json_ab12cd34",
      url: "/manus-storage/bookmark-backups/7/example.json",
    });
    mocks.createBookmarkBackup.mockResolvedValue(41);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.bookmarkBackups.save({
      fileName: "imported.json",
      source: "import",
      content: JSON.stringify({
        bookmarks: [{ type: "bookmark", id: "vite", title: "Vite", url: "https://vite.dev/" }],
      }),
    });

    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^bookmark-backups\/7\//),
      expect.stringContaining("https://vite.dev/"),
      "application/json; charset=utf-8",
    );
    expect(mocks.createBookmarkBackup).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      fileName: "imported.json",
      source: "import",
      bookmarkCount: 1,
      storageKey: expect.stringContaining("bookmark-backups/7/"),
    }));
    expect(result).toEqual({ id: 41, fileName: "imported.json", bookmarkCount: 1, source: "import" });
  });

  it("lists only the authenticated user's backup metadata", async () => {
    const rows = [{ id: 9, userId: 7, fileName: "snapshot.json", bookmarkCount: 3 }];
    mocks.listBookmarkBackups.mockResolvedValue(rows);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.bookmarkBackups.list()).resolves.toEqual(rows);
    expect(mocks.listBookmarkBackups).toHaveBeenCalledWith(7);
  });

  it("returns a storage URL only after owner-scoped metadata lookup", async () => {
    mocks.getBookmarkBackupForUser.mockResolvedValue({
      id: 12,
      userId: 7,
      storageKey: "bookmark-backups/7/restorable.json_1234abcd",
      fileName: "restorable.json",
      bookmarkCount: 2,
      source: "snapshot",
    });
    mocks.storageGet.mockResolvedValue({
      key: "bookmark-backups/7/restorable.json_1234abcd",
      url: "/manus-storage/bookmark-backups/7/restorable.json_1234abcd",
    });
    const caller = appRouter.createCaller(createContext());

    await expect(caller.bookmarkBackups.access({ id: 12 })).resolves.toEqual({
      id: 12,
      fileName: "restorable.json",
      bookmarkCount: 2,
      source: "snapshot",
      url: "/manus-storage/bookmark-backups/7/restorable.json_1234abcd",
    });
    expect(mocks.getBookmarkBackupForUser).toHaveBeenCalledWith(12, 7);
  });

  it("rejects access when no owner-scoped backup exists", async () => {
    mocks.getBookmarkBackupForUser.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.bookmarkBackups.access({ id: 404 })).rejects.toThrow("未找到该云端备份");
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });
});
