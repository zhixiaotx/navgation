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

export type BookmarkArchive = {
  version: 1;
  title: string;
  iconSource: IconSource;
  bookmarks: BookmarkNode[];
};

export const iconSources: { value: IconSource; label: string; detail: string }[] = [
  { value: "google", label: "Google S2", detail: "全球兼容，默认" },
  { value: "direct", label: "站点直连", detail: "直接请求 /favicon.ico" },
  { value: "favicon_im", label: "favicon.im", detail: "聚合服务" },
  { value: "favicon_iowen", label: "iowen.cn", detail: "国内聚合" },
  { value: "favicon_xinac", label: "xinac.net", detail: "聚合服务" },
  { value: "favicon_vip", label: "favicon.vip", detail: "聚合服务" },
  { value: "favicon_cravatar", label: "Cravatar", detail: "聚合服务" },
  { value: "favicon_baidu", label: "百度图标", detail: "国内聚合" },
  { value: "favicon_duckduckgo", label: "DuckDuckGo", detail: "全球聚合" },
  { value: "favicon_extractor", label: "Favicon Extractor", detail: "聚合服务" },
  { value: "favicon_pub", label: "FaviconPub", detail: "聚合服务" },
  { value: "favicon_afmax", label: "AFMax", detail: "国内聚合" },
  { value: "favicon_la4", label: "La4", detail: "国内聚合" },
  { value: "favicon_vvhan", label: "Vvhan", detail: "国内聚合" },
  { value: "logo_surf", label: "文字图标", detail: "本地生成" },
  { value: "iconify", label: "Iconify", detail: "需在数据中指定图标" },
  { value: "custom", label: "自定义", detail: "需在数据中指定图片地址" },
];

export const fallbackIconSources: IconSource[] = [
  "google",
  "favicon_im",
  "favicon_iowen",
  "favicon_baidu",
  "favicon_duckduckgo",
  "favicon_vvhan",
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
