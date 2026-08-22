type XlsxModule = typeof import("xlsx");

async function loadXlsx(): Promise<XlsxModule> {
  return import("xlsx");
}

export type IconSource =
  | "direct"
  | "favicon_im"
  | "favicon_iowen"
  | "favicon_xinac"
  | "favicon_vip"
  | "favicon_cravatar"
  | "favicon_baidu"
  | "favicon_duckduckgo"
  | "favicon_extractor"
  | "favicon_pub"
  | "favicon_afmax"
  | "favicon_la4"
  | "favicon_vvhan"
  | "logo_surf"
  | "google"
  | "iconify"
  | "custom";

export type BookmarkItem = {
  id: string;
  type: "bookmark";
  title: string;
  url: string;
  description?: string;
  iconSource?: IconSource;
  customIcon?: string;
  iconifyIcon?: string;
};

export type BookmarkFolder = {
  id: string;
  type: "folder";
  title: string;
  children: BookmarkNode[];
};

export type BookmarkNode = BookmarkFolder | BookmarkItem;

export type BookmarkImportPreview = {
  bookmarkCount: number;
  folderCount: number;
  maxDepth: number;
  samples: Array<BookmarkItem & { path: string[] }>;
};

export type BookmarkArchive = {
  version: 1;
  title: string;
  iconSource: IconSource;
  bookmarks: BookmarkNode[];
};

export const iconSources: { value: IconSource; label: string; detail: string }[] = [
  { value: "favicon_im", label: "favicon.im", detail: "聚合服务，默认" },
  { value: "favicon_iowen", label: "iowen.cn", detail: "国内聚合" },
  { value: "favicon_baidu", label: "百度图标", detail: "国内聚合" },
  { value: "favicon_afmax", label: "AFMax", detail: "国内聚合" },
  { value: "favicon_la4", label: "La4", detail: "国内聚合" },
  { value: "favicon_vvhan", label: "Vvhan", detail: "国内聚合" },
  { value: "favicon_xinac", label: "xinac.net", detail: "聚合服务" },
  { value: "favicon_vip", label: "favicon.vip", detail: "聚合服务" },
  { value: "favicon_cravatar", label: "Cravatar", detail: "聚合服务" },
  { value: "direct", label: "站点直连", detail: "直接请求 /favicon.ico" },
  { value: "favicon_duckduckgo", label: "DuckDuckGo", detail: "全球聚合" },
  { value: "favicon_extractor", label: "Favicon Extractor", detail: "聚合服务" },
  { value: "favicon_pub", label: "FaviconPub", detail: "聚合服务" },
  { value: "google", label: "Google S2", detail: "海外接口" },
  { value: "logo_surf", label: "文字图标", detail: "本地生成" },
  { value: "iconify", label: "Iconify", detail: "需在数据中指定图标" },
  { value: "custom", label: "自定义", detail: "需在数据中指定图片地址" },
];

export const fallbackIconSources: IconSource[] = [
  "favicon_im",
  "favicon_iowen",
  "favicon_baidu",
  "favicon_afmax",
  "favicon_la4",
  "favicon_duckduckgo",
  "favicon_vvhan",
  "google",
  "logo_surf",
];

export const sampleBookmarks: BookmarkNode[] = [
  {
    id: "f-productivity",
    type: "folder",
    title: "效率工作台",
    children: [
      {
        id: "b-notion",
        type: "bookmark",
        title: "Notion",
        url: "https://www.notion.so/",
        description: "笔记、项目与知识库",
      },
      {
        id: "b-linear",
        type: "bookmark",
        title: "Linear",
        url: "https://linear.app/",
        description: "产品规划与问题追踪",
      },
      {
        id: "f-writing",
        type: "folder",
        title: "写作与协作",
        children: [
          {
            id: "b-figma",
            type: "bookmark",
            title: "Figma",
            url: "https://www.figma.com/",
            description: "协作设计空间",
          },
          {
            id: "b-excalidraw",
            type: "bookmark",
            title: "Excalidraw",
            url: "https://excalidraw.com/",
            description: "快速表达想法",
          },
        ],
      },
    ],
  },
  {
    id: "f-knowledge",
    type: "folder",
    title: "知识与研究",
    children: [
      {
        id: "b-github",
        type: "bookmark",
        title: "GitHub",
        url: "https://github.com/",
        description: "代码与开源协作",
      },
      {
        id: "b-mdn",
        type: "bookmark",
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org/",
        description: "面向开发者的 Web 文档",
      },
      {
        id: "b-arxiv",
        type: "bookmark",
        title: "arXiv",
        url: "https://arxiv.org/",
        description: "开放学术论文库",
      },
    ],
  },
  {
    id: "f-ai",
    type: "folder",
    title: "AI 实验室",
    children: [
      {
        id: "b-openai",
        type: "bookmark",
        title: "OpenAI",
        url: "https://openai.com/",
        description: "模型与开发者资源",
      },
      {
        id: "b-huggingface",
        type: "bookmark",
        title: "Hugging Face",
        url: "https://huggingface.co/",
        description: "开源模型与数据集",
      },
      {
        id: "b-replicate",
        type: "bookmark",
        title: "Replicate",
        url: "https://replicate.com/",
        description: "云端模型运行平台",
      },
    ],
  },
  {
    id: "f-reading",
    type: "folder",
    title: "阅读清单",
    children: [
      {
        id: "b-medium",
        type: "bookmark",
        title: "Medium",
        url: "https://medium.com/",
        description: "独立观点与深度文章",
      },
      {
        id: "b-sspai",
        type: "bookmark",
        title: "少数派",
        url: "https://sspai.com/",
        description: "高效工作与数字生活",
      },
    ],
  },
];

export function isFolder(node: BookmarkNode): node is BookmarkFolder {
  return node.type === "folder";
}

export function makeId(prefix = "node") {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)}`;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function logoSurfIcon(label: string): string {
  const initials = (Array.from(label.trim()).filter(char => char.trim()).slice(0, 2).join("") || "N").toUpperCase();
  const safe = initials.replace(/[&<>"']/g, "");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="#1B5E7A"/><text x="48" y="57" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#FFFDF7">${safe}</text></svg>`)}`;
}

export function getFaviconUrl(item: BookmarkItem, source: IconSource): string {
  const hostname = getHostname(item.url);
  if (!hostname) return logoSurfIcon(item.title);

  switch (source) {
    case "direct":
      return `https://${hostname}/favicon.ico`;
    case "favicon_im":
      return `https://favicon.im/${hostname}?larger=true`;
    case "favicon_iowen":
      return `https://api.iowen.cn/favicon/${hostname}.png`;
    case "favicon_xinac":
      return `https://api.xinac.net/icon/?url=${encodeURIComponent(hostname)}`;
    case "favicon_vip":
      return `https://www.favicon.vip/get.php?url=${encodeURIComponent(hostname)}`;
    case "favicon_cravatar":
      return `https://cn.cravatar.com/favicon/api/index.php?url=${encodeURIComponent(hostname)}`;
    case "favicon_baidu":
      return `https://favicon.baidu.com/favicon?site=${encodeURIComponent(hostname)}`;
    case "favicon_duckduckgo":
      return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    case "favicon_extractor":
      return `https://www.faviconextractor.com/favicon/${hostname}?larger=true`;
    case "favicon_pub":
      return `https://faviconpub.app/favicon?domain=${encodeURIComponent(hostname)}`;
    case "favicon_afmax":
      return `https://api.afmax.cn/so/ico/index.php?r=${encodeURIComponent(hostname)}`;
    case "favicon_la4":
      return `https://ico.la4.cn/ico.php?url=${encodeURIComponent(hostname)}`;
    case "favicon_vvhan":
      return `https://api.vvhan.com/api/ico?url=${encodeURIComponent(hostname)}`;
    case "google":
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
    case "iconify":
      return item.iconifyIcon ? `https://api.iconify.design/${item.iconifyIcon}.svg` : logoSurfIcon(item.title);
    case "custom":
      return item.customIcon || logoSurfIcon(item.title);
    case "logo_surf":
    default:
      return logoSurfIcon(item.title);
  }
}

export function flattenBookmarks(nodes: BookmarkNode[], path: string[] = []): Array<BookmarkItem & { path: string[] }> {
  return nodes.flatMap(node =>
    isFolder(node)
      ? flattenBookmarks(node.children, [...path, node.title])
      : [{ ...node, path }],
  );
}

export function countBookmarks(nodes: BookmarkNode[]): number {
  return flattenBookmarks(nodes).length;
}

export function normalizeArchive(value: unknown): BookmarkNode[] {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { bookmarks?: unknown }).bookmarks)
      ? (value as { bookmarks: unknown[] }).bookmarks
      : null;
  if (!raw) throw new Error("未识别到可用的书签数据。");

  const normalizeNodes = (nodes: unknown[]): BookmarkNode[] =>
    nodes.flatMap<BookmarkNode>(node => {
      if (!node || typeof node !== "object") return [];
      const record = node as Record<string, unknown>;
      const title = typeof record.title === "string" && record.title.trim() ? record.title.trim() : "未命名项目";
      if (Array.isArray(record.children)) {
        return [{ id: typeof record.id === "string" ? record.id : makeId("folder"), type: "folder" as const, title, children: normalizeNodes(record.children) }];
      }
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!/^https?:\/\//i.test(url)) return [];
      return [{
        id: typeof record.id === "string" ? record.id : makeId("bookmark"),
        type: "bookmark" as const,
        title,
        url,
        description: typeof record.description === "string" ? record.description : undefined,
        iconSource: typeof record.iconSource === "string" && iconSources.some(source => source.value === record.iconSource) ? (record.iconSource as IconSource) : undefined,
        customIcon: typeof record.customIcon === "string" ? record.customIcon : undefined,
        iconifyIcon: typeof record.iconifyIcon === "string" ? record.iconifyIcon : undefined,
      }];
    });

  return normalizeNodes(raw);
}

function jsonRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function jsonText(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/** 兼容极光 Tab 原始导出：categories + sites。 */
function parseJgtabArchive(record: Record<string, unknown>): BookmarkNode[] | null {
  if (!Array.isArray(record.categories) || !Array.isArray(record.sites)) return null;

  const sites = record.sites;

  const categories = record.categories
    .map((category, index) => {
      const categoryRecord = jsonRecord(category);
      const title = typeof category === "string"
        ? category.trim()
        : categoryRecord ? jsonText(categoryRecord, ["name", "title", "label"], `未命名分类 ${index + 1}`) : "";
      const key = typeof category === "string" ? category.trim() : categoryRecord ? jsonText(categoryRecord, ["id", "name", "title", "label"], title) : title;
      return { key, title };
    })
    .filter(category => Boolean(category.title));

  const folders: BookmarkFolder[] = categories.map((category, categoryIndex) => ({
    id: `jgtab-folder-${categoryIndex + 1}-${makeId("source")}`,
    type: "folder",
    title: category.title,
    children: sites.flatMap((rawSite, siteIndex) => {
      const site = jsonRecord(rawSite);
      if (!site) return [];
      const siteCategory = jsonText(site, ["category", "categoryName", "group"]);
      if (siteCategory !== category.key && siteCategory !== category.title) return [];
      const url = jsonText(site, ["url", "link", "href"]);
      if (!isHttpUrl(url)) return [];
      return [{
        id: `jgtab-site-${jsonText(site, ["id"], String(siteIndex + 1))}-${makeId("source")}`,
        type: "bookmark" as const,
        title: jsonText(site, ["name", "title"], getHostname(url) || "未命名书签"),
        url,
        description: jsonText(site, ["description", "desc", "summary"]) || undefined,
      }];
    }),
  }));

  return folders.length ? [{ id: `source-jgtab-${makeId("archive")}`, type: "folder", title: "极光Tab 导航", children: folders }] : null;
}

/** 兼容 WebDesk 原始导出：categoryTree 递归目录。 */
function parseWebdeskArchive(record: Record<string, unknown>): BookmarkNode[] | null {
  if (!Array.isArray(record.categoryTree)) return null;

  const convertNode = (rawNode: unknown, path: string): BookmarkNode | null => {
    const node = jsonRecord(rawNode);
    if (!node) return null;
    const title = jsonText(node, ["name", "title", "label"], "未命名项目");
    if (Array.isArray(node.children)) {
      return {
        id: `webdesk-folder-${path}-${jsonText(node, ["id"], makeId("source"))}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
        type: "folder",
        title,
        children: node.children.flatMap((child, index) => {
          const converted = convertNode(child, `${path}-${index + 1}`);
          return converted ? [converted] : [];
        }),
      };
    }

    const url = jsonText(node, ["url", "link", "href"]);
    if (!isHttpUrl(url)) return null;
    return {
      id: `webdesk-site-${path}-${jsonText(node, ["linkId", "id"], makeId("source"))}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
      type: "bookmark",
      title,
      url,
      description: jsonText(node, ["description", "desc", "summary"]) || undefined,
    };
  };

  const folders = record.categoryTree.flatMap((node, index) => {
    const converted = convertNode(node, `root-${index + 1}`);
    return converted && isFolder(converted) ? [converted] : [];
  });

  return folders.length ? [{ id: `source-webdesk-${makeId("archive")}`, type: "folder", title: "WebDesk 导航", children: folders }] : null;
}

/**
 * 解析本站标准归档 JSON，以及极光 Tab、WebDesk 两种原始 JSON。
 * 原始格式会在浏览器本地转换为统一树结构，导入后可直接生成多级分类栏。
 */
export function parseBookmarkJson(value: unknown): BookmarkNode[] {
  try {
    const normalized = normalizeArchive(value);
    if (countBookmarks(normalized)) return normalized;
  } catch {
    // 标准归档不匹配时，继续检测已知的原始导出结构。
  }

  const record = jsonRecord(value);
  const converted = record ? parseJgtabArchive(record) ?? parseWebdeskArchive(record) : null;
  if (!converted || !countBookmarks(converted)) {
    throw new Error("未识别到可用书签。JSON 需为本站归档、极光 Tab（categories + sites）或 WebDesk（categoryTree）格式。");
  }
  return converted;
}

/** 为导入确认窗口提供可读的数据摘要及少量样本。 */
export function createBookmarkImportPreview(nodes: BookmarkNode[], sampleLimit = 6): BookmarkImportPreview {
  let folderCount = 0;
  let maxDepth = 0;
  const inspect = (items: BookmarkNode[], depth: number) => {
    for (const item of items) {
      if (!isFolder(item)) continue;
      folderCount += 1;
      maxDepth = Math.max(maxDepth, depth);
      inspect(item.children, depth + 1);
    }
  };
  inspect(nodes, 1);
  const entries = flattenBookmarks(nodes);
  return {
    bookmarkCount: entries.length,
    folderCount,
    maxDepth,
    samples: entries.slice(0, sampleLimit),
  };
}

export function parseBrowserBookmarkHtml(html: string): BookmarkNode[] {
  if (!/<dl\b/i.test(html) || !/<(?:a|h3)\b/i.test(html)) {
    throw new Error("该 HTML 文件不是标准浏览器书签导出文件。");
  }

  const decodeHtml = (value: string) => value
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_match, entity: string) => {
      if (entity.charAt(0) === "#") {
        const code = entity.charAt(1).toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCharCode(code) : "";
      }
      return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " } as Record<string, string>)[entity.toLowerCase()] ?? "";
    })
    .replace(/\s+/g, " ")
    .trim();
  const readHref = (attributes: string) => {
    const match = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
  };
  const readDescription = (attributes: string) => {
    const match = attributes.match(/\bdata-description\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "") || undefined;
  };

  const root: BookmarkNode[] = [];
  const folders: BookmarkNode[][] = [root];
  let pendingFolder: BookmarkFolder | null = null;
  let depth = 0;
  const tokenPattern = /<(\/?)dl\b[^>]*>|<h3\b[^>]*>([\s\S]*?)<\/h3\s*>|<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let token: RegExpExecArray | null;

  while ((token = tokenPattern.exec(html))) {
    const [full, closingDl, h3Title, anchorAttributes, anchorTitle] = token;
    if (/^<\/?dl\b/i.test(full)) {
      if (closingDl) {
        if (depth > 1) folders.pop();
        depth = Math.max(0, depth - 1);
      } else {
        if (depth > 0 && pendingFolder) {
          folders.push(pendingFolder.children);
          pendingFolder = null;
        }
        depth += 1;
      }
      continue;
    }
    if (typeof h3Title === "string") {
      const folder: BookmarkFolder = {
        id: makeId("folder"),
        type: "folder",
        title: decodeHtml(h3Title) || "未命名分类",
        children: [],
      };
      folders[folders.length - 1].push(folder);
      pendingFolder = folder;
      continue;
    }
    if (typeof anchorAttributes === "string") {
      const url = readHref(anchorAttributes);
      if (/^https?:\/\//i.test(url)) {
        folders[folders.length - 1].push({
          id: makeId("bookmark"),
          type: "bookmark",
          title: decodeHtml(anchorTitle || "") || getHostname(url) || "未命名书签",
          url,
          description: readDescription(anchorAttributes),
        });
      }
    }
  }

  const result = root;
  if (!result.length) throw new Error("没有找到可导入的书签链接。");
  return result;
}

function cloneNode(node: BookmarkNode): BookmarkNode {
  return isFolder(node) ? { ...node, children: node.children.map(cloneNode) } : { ...node };
}

function comparableTitle(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/**
 * 以既有分类为主顺序，逐层合并新导入内容；同名文件夹递归并入、同 URL 链接去重，
 * 未出现过的节点则严格按导入文件原有顺序追加。
 */
export function mergeBookmarkNodes(current: BookmarkNode[], incoming: BookmarkNode[]): BookmarkNode[] {
  const output = current.map(cloneNode);
  for (const candidate of incoming) {
    if (isFolder(candidate)) {
      const existing = output.find(node => isFolder(node) && comparableTitle(node.title) === comparableTitle(candidate.title));
      if (existing && isFolder(existing)) {
        existing.children = mergeBookmarkNodes(existing.children, candidate.children);
      } else {
        output.push(cloneNode(candidate));
      }
      continue;
    }
    const alreadyExists = output.some(node => !isFolder(node) && node.url === candidate.url);
    if (!alreadyExists) output.push(cloneNode(candidate));
  }
  return output;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char] ?? char);
}

export function toBrowserBookmarkHtml(nodes: BookmarkNode[], title = "书签导航"): string {
  const render = (list: BookmarkNode[]): string => list.map(node => {
    if (isFolder(node)) {
      return `    <DT><H3>${escapeHtml(node.title)}</H3>\n    <DL><p>\n${render(node.children)}    </DL><p>\n`;
    }
    const description = node.description ? ` DATA-DESCRIPTION="${escapeHtml(node.description)}"` : "";
    return `    <DT><A HREF="${escapeHtml(node.url)}"${description}>${escapeHtml(node.title)}</A>\n`;
  }).join("");
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<!-- This is an automatically generated file. -->\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>${escapeHtml(title)}</TITLE>\n<H1>${escapeHtml(title)}</H1>\n<DL><p>\n${render(nodes)}</DL><p>`;
}

export function archiveForExport(bookmarks: BookmarkNode[], iconSource: IconSource): BookmarkArchive {
  return { version: 1, title: "书签导航", iconSource, bookmarks };
}

/**
 * XLSX / CSV 交换格式使用易读的分类路径列。路径以“ / ”分隔，导入时会按此路径重建文件夹树。
 */
export const bookmarkSpreadsheetColumns = {
  categoryPath: "分类路径",
  title: "名称",
  url: "网址",
  description: "说明",
  iconSource: "图标来源",
  customIcon: "自定义图标",
  iconifyIcon: "Iconify 图标",
} as const;

export type BookmarkSpreadsheetFormat = "xlsx" | "csv";
export type BookmarkSpreadsheetRow = Record<(typeof bookmarkSpreadsheetColumns)[keyof typeof bookmarkSpreadsheetColumns], string>;

const spreadsheetHeaders = Object.values(bookmarkSpreadsheetColumns);

function normalizeComparableTitle(value: string) {
  return value.trim().toLocaleLowerCase();
}

function cellText(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function readSpreadsheetCell(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = cellText(row[key]);
    if (value) return value;
  }
  return "";
}

function spreadsheetPath(value: string) {
  return value
    .split(/\s*\/\s*/)
    .map(segment => segment.trim())
    .filter(Boolean);
}

/** 将嵌套书签树扁平为一行一个网址的表格记录。 */
export function bookmarkNodesToSpreadsheetRows(nodes: BookmarkNode[], ancestry: string[] = []): BookmarkSpreadsheetRow[] {
  return nodes.flatMap(node => {
    if (isFolder(node)) return bookmarkNodesToSpreadsheetRows(node.children, [...ancestry, node.title]);
    return [{
      [bookmarkSpreadsheetColumns.categoryPath]: ancestry.join(" / "),
      [bookmarkSpreadsheetColumns.title]: node.title,
      [bookmarkSpreadsheetColumns.url]: node.url,
      [bookmarkSpreadsheetColumns.description]: node.description ?? "",
      [bookmarkSpreadsheetColumns.iconSource]: node.iconSource ?? "",
      [bookmarkSpreadsheetColumns.customIcon]: node.customIcon ?? "",
      [bookmarkSpreadsheetColumns.iconifyIcon]: node.iconifyIcon ?? "",
    }];
  });
}

/**
 * 将表格行按“分类路径”重新组装为多级目录。相同路径的分类会复用同一个文件夹，从而自动生成左侧树。
 */
export function spreadsheetRowsToBookmarkNodes(rows: Array<Record<string, unknown>>): BookmarkNode[] {
  const root: BookmarkNode[] = [];

  for (const row of rows) {
    const url = readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.url, "URL", "url", "链接", "link"]);
    if (!/^https?:\/\//i.test(url)) continue;

    const title = readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.title, "标题", "title", "name"]) || getHostname(url) || "未命名书签";
    const path = spreadsheetPath(readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.categoryPath, "分类", "categoryPath", "category"]));
    let target = root;

    for (const segment of path) {
      const comparable = normalizeComparableTitle(segment);
      let folder = target.find(node => isFolder(node) && normalizeComparableTitle(node.title) === comparable);
      if (!folder || !isFolder(folder)) {
        folder = { id: makeId("spreadsheet-folder"), type: "folder", title: segment, children: [] };
        target.push(folder);
      }
      target = folder.children;
    }

    const source = readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.iconSource, "iconSource"]);
    const item: BookmarkItem = {
      id: makeId("spreadsheet-bookmark"),
      type: "bookmark",
      title,
      url,
    };
    const description = readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.description, "description"]);
    const customIcon = readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.customIcon, "customIcon"]);
    const iconifyIcon = readSpreadsheetCell(row, [bookmarkSpreadsheetColumns.iconifyIcon, "iconifyIcon"]);
    if (description) item.description = description;
    if (iconSources.some(candidate => candidate.value === source)) item.iconSource = source as IconSource;
    if (customIcon) item.customIcon = customIcon;
    if (iconifyIcon) item.iconifyIcon = iconifyIcon;
    target.push(item);
  }

  if (!root.length || !countBookmarks(root)) {
    throw new Error("表格中未找到有效书签。请至少填写“名称”“网址”，网址需以 http:// 或 https:// 开头。");
  }
  return root;
}

export async function parseBookmarkSpreadsheetArrayBuffer(data: ArrayBuffer): Promise<BookmarkNode[]> {
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(data, { type: "array", cellDates: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("表格中没有可读取的工作表。");
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  return spreadsheetRowsToBookmarkNodes(rows);
}

export async function parseBookmarkSpreadsheetFile(file: Pick<File, "arrayBuffer">): Promise<BookmarkNode[]> {
  return parseBookmarkSpreadsheetArrayBuffer(await file.arrayBuffer());
}

/** 生成含分类路径、名称、网址和可选图标字段的 XLSX 或带 UTF-8 BOM 的 CSV。 */
export async function createBookmarkSpreadsheetBlob(bookmarks: BookmarkNode[], format: BookmarkSpreadsheetFormat): Promise<Blob> {
  return createBookmarkSpreadsheetBlobFromRows(bookmarkNodesToSpreadsheetRows(bookmarks), format, "书签");
}

async function createBookmarkSpreadsheetBlobFromRows(rows: BookmarkSpreadsheetRow[], format: BookmarkSpreadsheetFormat, sheetName: string): Promise<Blob> {
  const XLSX = await loadXlsx();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: spreadsheetHeaders });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  }

  const binary = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([binary], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** 生成仅含规范列头的 XLSX / CSV 空白模板，便于首次录入。 */
export async function createBlankBookmarkSpreadsheetBlob(format: BookmarkSpreadsheetFormat): Promise<Blob> {
  return createBookmarkSpreadsheetBlobFromRows([], format, "书签导入模板");
}

/** 生成含三层分类路径的 XLSX / CSV 样例，便于理解表格导入的分类还原规则。 */
export async function createMultiLevelBookmarkSpreadsheetExampleBlob(format: BookmarkSpreadsheetFormat): Promise<Blob> {
  return createBookmarkSpreadsheetBlobFromRows(bookmarkNodesToSpreadsheetRows(sampleBookmarks), format, "多级分类示例");
}
