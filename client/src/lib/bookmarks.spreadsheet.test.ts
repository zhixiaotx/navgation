import { describe, expect, it } from "vitest";
import {
  bookmarkNodesToSpreadsheetRows,
  bookmarkSpreadsheetColumns,
  countBookmarks,
  createBlankBookmarkSpreadsheetBlob,
  createBookmarkImportPreview,
  createBookmarkSpreadsheetBlob,
  createMultiLevelBookmarkSpreadsheetExampleBlob,
  isFolder,
  parseBookmarkJson,
  parseBookmarkSpreadsheetArrayBuffer,
  spreadsheetRowsToBookmarkNodes,
} from "./bookmarks";

describe("bookmark spreadsheet interchange", () => {
  it("rebuilds a nested category tree from category paths", () => {
    const nodes = spreadsheetRowsToBookmarkNodes([
      {
        [bookmarkSpreadsheetColumns.categoryPath]: "工作 / 开发 / 前端",
        [bookmarkSpreadsheetColumns.title]: "Vite",
        [bookmarkSpreadsheetColumns.url]: "https://vite.dev/",
      },
      {
        [bookmarkSpreadsheetColumns.categoryPath]: "工作 / 研究",
        [bookmarkSpreadsheetColumns.title]: "MDN",
        [bookmarkSpreadsheetColumns.url]: "https://developer.mozilla.org/",
      },
      {
        [bookmarkSpreadsheetColumns.categoryPath]: "生活",
        [bookmarkSpreadsheetColumns.title]: "示例",
        [bookmarkSpreadsheetColumns.url]: "https://example.com/",
      },
    ]);

    expect(nodes).toHaveLength(2);
    expect(isFolder(nodes[0])).toBe(true);
    if (!isFolder(nodes[0])) throw new Error("expected folder");
    expect(nodes[0].title).toBe("工作");
    expect(nodes[0].children.filter(isFolder).map(folder => folder.title)).toEqual(["开发", "研究"]);
    expect(countBookmarks(nodes)).toBe(3);
  });

  it("exports and imports CSV without losing paths or optional icon fields", async () => {
    const source = spreadsheetRowsToBookmarkNodes([{
      [bookmarkSpreadsheetColumns.categoryPath]: "资料 / 设计",
      [bookmarkSpreadsheetColumns.title]: "Iconify",
      [bookmarkSpreadsheetColumns.url]: "https://iconify.design/",
      [bookmarkSpreadsheetColumns.description]: "图标集合",
      [bookmarkSpreadsheetColumns.iconSource]: "iconify",
      [bookmarkSpreadsheetColumns.iconifyIcon]: "logos:iconify",
    }]);
    const blob = await createBookmarkSpreadsheetBlob(source, "csv");
    const result = await parseBookmarkSpreadsheetArrayBuffer(await blob.arrayBuffer());
    const rows = bookmarkNodesToSpreadsheetRows(result);

    expect(rows).toEqual([expect.objectContaining({
      [bookmarkSpreadsheetColumns.categoryPath]: "资料 / 设计",
      [bookmarkSpreadsheetColumns.title]: "Iconify",
      [bookmarkSpreadsheetColumns.iconSource]: "iconify",
      [bookmarkSpreadsheetColumns.iconifyIcon]: "logos:iconify",
    })]);
  });

  it("exports and imports an XLSX workbook with the same bookmark count", async () => {
    const source = spreadsheetRowsToBookmarkNodes([
      {
        [bookmarkSpreadsheetColumns.categoryPath]: "工具 / 协作",
        [bookmarkSpreadsheetColumns.title]: "Figma",
        [bookmarkSpreadsheetColumns.url]: "https://www.figma.com/",
      },
      {
        [bookmarkSpreadsheetColumns.categoryPath]: "工具 / 开发",
        [bookmarkSpreadsheetColumns.title]: "GitHub",
        [bookmarkSpreadsheetColumns.url]: "https://github.com/",
      },
    ]);
    const blob = await createBookmarkSpreadsheetBlob(source, "xlsx");
    const result = await parseBookmarkSpreadsheetArrayBuffer(await blob.arrayBuffer());

    expect(countBookmarks(result)).toBe(2);
    expect(bookmarkNodesToSpreadsheetRows(result).map(row => row[bookmarkSpreadsheetColumns.categoryPath])).toEqual([
      "工具 / 协作",
      "工具 / 开发",
    ]);
  });

  it("parses original JGTab JSON and exposes an import preview", () => {
    const nodes = parseBookmarkJson({
      categories: ["开发", "设计"],
      sites: [
        { id: 1, category: "开发", name: "Vite", url: "https://vite.dev/", description: "构建工具" },
        { id: 2, category: "设计", name: "Figma", url: "https://www.figma.com/" },
      ],
    });
    const preview = createBookmarkImportPreview(nodes);

    expect(countBookmarks(nodes)).toBe(2);
    expect(preview).toMatchObject({ bookmarkCount: 2, folderCount: 3, maxDepth: 2 });
    expect(preview.samples.map(item => item.title)).toEqual(["Vite", "Figma"]);
  });

  it("creates a CSV blank template with the documented columns", async () => {
    const blob = await createBlankBookmarkSpreadsheetBlob("csv");
    const content = await blob.text();

    expect(content).toContain(bookmarkSpreadsheetColumns.categoryPath);
    expect(content).toContain(bookmarkSpreadsheetColumns.title);
    expect(content).toContain(bookmarkSpreadsheetColumns.url);
  });

  it("creates a multi-level category example that can be re-imported", async () => {
    const blob = await createMultiLevelBookmarkSpreadsheetExampleBlob("csv");
    const result = await parseBookmarkSpreadsheetArrayBuffer(await blob.arrayBuffer());
    const paths = bookmarkNodesToSpreadsheetRows(result).map(row => row[bookmarkSpreadsheetColumns.categoryPath]);

    expect(paths).toContain("效率工作台 / 写作与协作");
    expect(countBookmarks(result)).toBeGreaterThan(3);
  });
});
