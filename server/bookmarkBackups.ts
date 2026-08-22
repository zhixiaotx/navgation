export const BOOKMARK_JSON_CONTENT_TYPE = "application/json; charset=utf-8";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRootNodes(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.bookmarks)) return value.bookmarks;
  throw new Error("JSON 必须是书签数组，或包含 bookmarks 数组的对象。");
}

function countNodes(nodes: unknown[]): number {
  return nodes.reduce<number>((count, node) => {
    if (!isRecord(node)) return count;
    if (Array.isArray(node.children)) return count + countNodes(node.children);
    return typeof node.url === "string" && /^https?:\/\//i.test(node.url.trim()) ? count + 1 : count;
  }, 0);
}

export function inspectBookmarkJson(content: string): { bookmarkCount: number } {
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes > MAX_BACKUP_BYTES) throw new Error("JSON 文件超过 5 MB，无法保存为云端备份。");

  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    throw new Error("文件不是有效的 JSON，无法保存为书签备份。");
  }

  const bookmarkCount = countNodes(getRootNodes(value));
  if (!bookmarkCount) throw new Error("JSON 中未找到有效的 http 或 https 书签链接。");
  return { bookmarkCount };
}

export function normalizeBackupFileName(fileName: string) {
  const base = fileName
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 180) || "bookmarks";
  return base.toLowerCase().endsWith(".json") ? base : `${base}.json`;
}

export function buildBookmarkBackupKey(userId: number, fileName: string, now = new Date()) {
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  return `bookmark-backups/${userId}/${timestamp}-${normalizeBackupFileName(fileName)}`;
}
