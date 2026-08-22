import { describe, expect, it } from "vitest";
import {
  buildBookmarkBackupKey,
  inspectBookmarkJson,
  normalizeBackupFileName,
} from "./bookmarkBackups";

describe("bookmark backup helpers", () => {
  it("accepts the app archive shape and counts nested bookmarks", () => {
    const result = inspectBookmarkJson(JSON.stringify({
      bookmarks: [{ type: "folder", title: "开发", children: [
        { type: "bookmark", title: "Vite", url: "https://vite.dev" },
        { type: "bookmark", title: "无效", url: "ftp://invalid.test" },
      ] }],
    }));
    expect(result.bookmarkCount).toBe(1);
  });

  it("rejects JSON that has no bookmark collection", () => {
    expect(() => inspectBookmarkJson(JSON.stringify({ title: "无书签" }))).toThrow("bookmarks");
  });

  it("normalizes a user filename into a scoped object-storage key", () => {
    const name = normalizeBackupFileName('我的/书签?.JSON');
    expect(name).toBe("我的-书签-.JSON");
    expect(buildBookmarkBackupKey(42, name, new Date("2026-08-22T08:00:00.000Z"))).toBe(
      "bookmark-backups/42/2026-08-22T08-00-00-000Z-我的-书签-.JSON",
    );
  });
});
