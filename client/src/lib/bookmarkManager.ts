import { BookmarkFolder, BookmarkItem, BookmarkNode, isFolder, makeId } from "./bookmarks";

export const ROOT_FOLDER_ID = "__root__";

export type FolderOption = {
  id: string;
  title: string;
  path: string;
  depth: number;
};

export function cloneBookmarkTree(nodes: BookmarkNode[]): BookmarkNode[] {
  return nodes.map(node => isFolder(node) ? { ...node, children: cloneBookmarkTree(node.children) } : { ...node });
}

export function listFolderOptions(nodes: BookmarkNode[], ancestry: string[] = []): FolderOption[] {
  return nodes.flatMap(node => {
    if (!isFolder(node)) return [];
    const path = [...ancestry, node.title];
    return [{ id: node.id, title: node.title, path: path.join(" / "), depth: ancestry.length }, ...listFolderOptions(node.children, path)];
  });
}

export function findBookmarkNode(nodes: BookmarkNode[], id: string): BookmarkNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (isFolder(node)) {
      const nested = findBookmarkNode(node.children, id);
      if (nested) return nested;
    }
  }
  return undefined;
}

function updateNode(nodes: BookmarkNode[], id: string, transform: (node: BookmarkNode) => BookmarkNode): BookmarkNode[] {
  return nodes.map(node => {
    if (node.id === id) return transform(node);
    return isFolder(node) ? { ...node, children: updateNode(node.children, id, transform) } : node;
  });
}

function appendToFolder(nodes: BookmarkNode[], parentId: string, entries: BookmarkNode[]): { nodes: BookmarkNode[]; applied: boolean } {
  if (parentId === ROOT_FOLDER_ID) return { nodes: [...nodes, ...entries], applied: true };
  let applied = false;
  const result = nodes.map(node => {
    if (node.id === parentId && isFolder(node)) {
      applied = true;
      return { ...node, children: [...node.children, ...entries] };
    }
    if (isFolder(node)) {
      const nested = appendToFolder(node.children, parentId, entries);
      if (nested.applied) {
        applied = true;
        return { ...node, children: nested.nodes };
      }
    }
    return node;
  });
  return { nodes: result, applied };
}

function extractNodes(nodes: BookmarkNode[], ids: Set<string>): { nodes: BookmarkNode[]; extracted: BookmarkNode[] } {
  const extracted: BookmarkNode[] = [];
  const result: BookmarkNode[] = [];
  nodes.forEach(node => {
    if (ids.has(node.id)) {
      extracted.push(node);
      return;
    }
    if (isFolder(node)) {
      const nested = extractNodes(node.children, ids);
      extracted.push(...nested.extracted);
      result.push({ ...node, children: nested.nodes });
      return;
    }
    result.push(node);
  });
  return { nodes: result, extracted };
}

function folderContainsId(folder: BookmarkFolder, id: string): boolean {
  return folder.children.some(node => node.id === id || (isFolder(node) && folderContainsId(node, id)));
}

export function createFolder(nodes: BookmarkNode[], title: string, parentId = ROOT_FOLDER_ID): BookmarkNode[] {
  const normalized = title.trim();
  if (!normalized) throw new Error("分类名称不能为空。");
  const folder: BookmarkFolder = { id: makeId("folder"), type: "folder", title: normalized, children: [] };
  const result = appendToFolder(cloneBookmarkTree(nodes), parentId, [folder]);
  if (!result.applied) throw new Error("目标分类不存在，无法创建子分类。");
  return result.nodes;
}

export function createBookmark(nodes: BookmarkNode[], values: Pick<BookmarkItem, "title" | "url"> & Partial<Omit<BookmarkItem, "id" | "type" | "title" | "url">>, parentId = ROOT_FOLDER_ID): BookmarkNode[] {
  const title = values.title.trim();
  const url = values.url.trim();
  if (!title) throw new Error("书签名称不能为空。");
  if (!/^https?:\/\//i.test(url)) throw new Error("网址需以 http:// 或 https:// 开头。");
  const item: BookmarkItem = { id: makeId("bookmark"), type: "bookmark", title, url };
  if (values.description?.trim()) item.description = values.description.trim();
  if (values.iconSource) item.iconSource = values.iconSource;
  if (values.customIcon?.trim()) item.customIcon = values.customIcon.trim();
  if (values.iconifyIcon?.trim()) item.iconifyIcon = values.iconifyIcon.trim();
  const result = appendToFolder(cloneBookmarkTree(nodes), parentId, [item]);
  if (!result.applied) throw new Error("目标分类不存在，无法创建书签。");
  return result.nodes;
}

export function renameBookmarkNode(nodes: BookmarkNode[], id: string, title: string): BookmarkNode[] {
  const normalized = title.trim();
  if (!normalized) throw new Error("名称不能为空。");
  if (!findBookmarkNode(nodes, id)) throw new Error("未找到要重命名的项目。");
  return updateNode(cloneBookmarkTree(nodes), id, node => ({ ...node, title: normalized }));
}

export function updateBookmark(nodes: BookmarkNode[], id: string, values: Pick<BookmarkItem, "title" | "url"> & Partial<Omit<BookmarkItem, "id" | "type" | "title" | "url">>): BookmarkNode[] {
  const current = findBookmarkNode(nodes, id);
  if (!current || isFolder(current)) throw new Error("未找到要编辑的书签。");
  const title = values.title.trim();
  const url = values.url.trim();
  if (!title) throw new Error("书签名称不能为空。");
  if (!/^https?:\/\//i.test(url)) throw new Error("网址需以 http:// 或 https:// 开头。");
  return updateNode(cloneBookmarkTree(nodes), id, node => ({
    ...node,
    title,
    url,
    description: values.description?.trim() || undefined,
    iconSource: values.iconSource,
    customIcon: values.customIcon?.trim() || undefined,
    iconifyIcon: values.iconifyIcon?.trim() || undefined,
  } as BookmarkItem));
}

export function removeBookmarkNodes(nodes: BookmarkNode[], ids: Iterable<string>): BookmarkNode[] {
  const removeIds = new Set(ids);
  return extractNodes(cloneBookmarkTree(nodes), removeIds).nodes;
}

export function moveBookmarkNodes(nodes: BookmarkNode[], ids: Iterable<string>, targetFolderId: string): BookmarkNode[] {
  const moveIds = new Set(ids);
  if (!moveIds.size) return cloneBookmarkTree(nodes);
  const source = cloneBookmarkTree(nodes);
  const target = targetFolderId === ROOT_FOLDER_ID ? undefined : findBookmarkNode(source, targetFolderId);
  if (target && !isFolder(target)) throw new Error("只能移动到分类目录中。");
  for (const id of Array.from(moveIds)) {
    const node = findBookmarkNode(source, id);
    if (node && isFolder(node) && (node.id === targetFolderId || folderContainsId(node, targetFolderId))) {
      throw new Error("不能将分类移动到自身或其子分类中。");
    }
  }
  const extracted = extractNodes(source, moveIds);
  const result = appendToFolder(extracted.nodes, targetFolderId, extracted.extracted);
  if (!result.applied) throw new Error("目标分类不存在，无法移动项目。");
  return result.nodes;
}

function reorderInList(nodes: BookmarkNode[], id: string, direction: -1 | 1): { nodes: BookmarkNode[]; changed: boolean } {
  const index = nodes.findIndex(node => node.id === id);
  if (index >= 0) {
    const target = index + direction;
    if (target < 0 || target >= nodes.length) return { nodes, changed: false };
    const result = [...nodes];
    [result[index], result[target]] = [result[target], result[index]];
    return { nodes: result, changed: true };
  }
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!isFolder(node)) continue;
    const nested = reorderInList(node.children, id, direction);
    if (nested.changed) {
      const result = [...nodes];
      result[index] = { ...node, children: nested.nodes };
      return { nodes: result, changed: true };
    }
  }
  return { nodes, changed: false };
}

export function reorderBookmarkNode(nodes: BookmarkNode[], id: string, direction: -1 | 1): BookmarkNode[] {
  return reorderInList(cloneBookmarkTree(nodes), id, direction).nodes;
}
