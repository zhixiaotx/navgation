import { describe, expect, it } from "vitest";
import { BookmarkNode } from "./bookmarks";
import {
  ROOT_FOLDER_ID,
  createBookmark,
  createFolder,
  listFolderOptions,
  moveBookmarkNodes,
  removeBookmarkNodes,
  renameBookmarkNode,
  reorderBookmarkNode,
  updateBookmark,
} from "./bookmarkManager";

const seed: BookmarkNode[] = [
  {
    id: "folder-a",
    type: "folder",
    title: "工作",
    children: [
      { id: "bookmark-a", type: "bookmark", title: "首页", url: "https://example.com" },
      { id: "bookmark-b", type: "bookmark", title: "文档", url: "https://example.org" },
    ],
  },
  { id: "bookmark-root", type: "bookmark", title: "根书签", url: "https://root.example" },
];

describe("bookmark management helpers", () => {
  it("creates nested folders and bookmarks while preserving a source tree", () => {
    const withFolder = createFolder(seed, "协作", "folder-a");
    const added = createBookmark(withFolder, { title: "原型", url: "https://figma.com" }, "folder-a");
    expect(seed[0]).toMatchObject({ title: "工作" });
    expect(listFolderOptions(added).map(option => option.path)).toEqual(["工作", "工作 / 协作"]);
    expect((added[0] as { children: BookmarkNode[] }).children.at(-1)).toMatchObject({ title: "原型" });
  });

  it("renames, edits, removes and reorders nodes", () => {
    const renamed = renameBookmarkNode(seed, "folder-a", "项目");
    const edited = updateBookmark(renamed, "bookmark-a", { title: "门户", url: "https://example.net", description: "起始页" });
    const reordered = reorderBookmarkNode(edited, "bookmark-b", -1);
    const removed = removeBookmarkNodes(reordered, ["bookmark-root"]);
    const children = (removed[0] as { children: BookmarkNode[] }).children;
    expect(children.map(node => node.id)).toEqual(["bookmark-b", "bookmark-a"]);
    expect(children[1]).toMatchObject({ title: "门户", url: "https://example.net", description: "起始页" });
    expect(removed).toHaveLength(1);
  });

  it("moves multiple nodes and rejects moving a folder into its own descendant", () => {
    const moved = moveBookmarkNodes(seed, ["bookmark-root", "bookmark-b"], "folder-a");
    expect((moved[0] as { children: BookmarkNode[] }).children.map(node => node.id)).toEqual(["bookmark-a", "bookmark-b", "bookmark-root"]);
    expect(moved).toHaveLength(1);
    expect(() => moveBookmarkNodes(createFolder(seed, "子项", "folder-a"), ["folder-a"], "folder-unknown")).toThrow("目标分类不存在");
    expect(() => moveBookmarkNodes(createFolder(seed, "子项", "folder-a"), ["folder-a"], "folder-a")).toThrow("不能将分类移动到自身或其子分类中");
    expect(ROOT_FOLDER_ID).toBe("__root__");
  });
});
