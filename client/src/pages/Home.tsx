/**
 * 档案索引室设计：固定分类索引脊 + 资料卡式书签，以档案蓝强调检索、定位和打开。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArrowUp,
  BookmarkPlus,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  Command,
  Download,
  Eraser,
  ExternalLink,
  FileArchive,
  FileJson2,
  FileSpreadsheet,
  FileUp,
  FolderClosed,
  FolderPlus,
  FolderOpen,
  LogIn,
  LayoutGrid,
  Move,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  archiveForExport,
  BookmarkFolder,
  BookmarkItem,
  BookmarkNode,
  countBookmarks,
  createBlankBookmarkSpreadsheetBlob,
  createBookmarkImportPreview,
  createBookmarkSpreadsheetBlob,
  createMultiLevelBookmarkSpreadsheetExampleBlob,
  defaultSpreadsheetPathSeparator,
  fallbackIconSources,
  flattenBookmarks,
  getFaviconUrl,
  getHostname,
  IconSource,
  iconSources,
  isFolder,
  mergeBookmarkNodes,
  normalizeArchive,
  parseBookmarkJson,
  parseBrowserBookmarkHtml,
  parseBookmarkSpreadsheetFile,
  sampleBookmarks,
  toBrowserBookmarkHtml,
} from "@/lib/bookmarks";
import {
  ROOT_FOLDER_ID,
  createBookmark as createManagedBookmark,
  createFolder as createManagedFolder,
  findBookmarkNode,
  listFolderOptions,
  moveBookmarkNodes,
  removeBookmarkNodes,
  renameBookmarkNode,
  reorderBookmarkNode,
  updateBookmark as updateManagedBookmark,
} from "@/lib/bookmarkManager";
import { createStandaloneNavigation } from "@/lib/standalone";
import { CardDensity, coerceDescriptionLineLimit, DescriptionLineLimit, resolveDescriptionVisibility } from "@/lib/bookmarkDisplayPreferences";
import { FLOWER_LOGO_URL } from "@/lib/flowerLogo";

const LOGO_URL = FLOWER_LOGO_URL;
const DEFAULT_BOOKMARKS_URL = "./data/default-bookmarks.json";
const DEFAULT_DATA_VERSION = "2026-08-22";
const EXPORT_USERNAME = "admin";
const EXPORT_PASSWORD = "123456";
const EXPORT_AUTH_STORAGE_KEY = "archive-index-export-authorized";

type ExportKind = "json" | "html" | "xlsx" | "csv" | "standalone";
type PendingImport = {
  nodes: BookmarkNode[];
  fileName: string;
  source: "json" | "html" | "spreadsheet";
  preview: ReturnType<typeof createBookmarkImportPreview>;
};

type SettingsTab = "manage" | "bookmarks" | "backup" | "external";
type BookmarkDraft = { title: string; url: string; description: string; parentId: string };

const spreadsheetFieldHelp = [
  { field: "分类路径", detail: "可选。用当前分隔符写出层级，例如“效率工作台 / 写作与协作”。" },
  { field: "名称", detail: "可选。留空时会自动使用网址域名。" },
  { field: "网址", detail: "必填。必须以 http:// 或 https:// 开头。" },
  { field: "说明", detail: "可选。用于站内搜索和书签语义。" },
  { field: "图标来源", detail: "可选。例如 favicon_im、google、custom 或 iconify。" },
  { field: "自定义图标", detail: "仅在图标来源为 custom 时填写图片 URL。" },
  { field: "Iconify 图标", detail: "仅在图标来源为 iconify 时填写，例如 logos:vitejs。" },
];

const emptyBookmarkDraft = (): BookmarkDraft => ({ title: "", url: "", description: "", parentId: ROOT_FOLDER_ID });

const searchEngines = [
  { id: "bing", label: "必应", region: "全球", url: "https://www.bing.com/search?q=" },
  { id: "baidu", label: "百度", region: "国内", url: "https://www.baidu.com/s?wd=" },
  { id: "sogou", label: "搜狗", region: "国内", url: "https://www.sogou.com/web?query=" },
  { id: "360", label: "360 搜索", region: "国内", url: "https://www.so.com/s?q=" },
  { id: "shenma", label: "神马", region: "国内", url: "https://m.sm.cn/s?q=" },
  { id: "quark", label: "夸克", region: "国内", url: "https://quark.sm.cn/s?q=" },
  { id: "wechat", label: "微信文章", region: "国内", url: "https://weixin.sogou.com/weixin?type=2&query=" },
  { id: "toutiao", label: "头条搜索", region: "国内", url: "https://so.toutiao.com/search?keyword=" },
  { id: "google", label: "Google", region: "海外", url: "https://www.google.com/search?q=" },
  { id: "duckduckgo", label: "DuckDuckGo", region: "海外", url: "https://duckduckgo.com/?q=" },
  { id: "yahoo", label: "Yahoo", region: "海外", url: "https://search.yahoo.com/search?p=" },
  { id: "yandex", label: "Yandex", region: "海外", url: "https://yandex.com/search/?text=" },
  { id: "brave", label: "Brave Search", region: "海外", url: "https://search.brave.com/search?q=" },
  { id: "startpage", label: "Startpage", region: "海外", url: "https://www.startpage.com/sp/search?query=" },
  { id: "ecosia", label: "Ecosia", region: "海外", url: "https://www.ecosia.org/search?q=" },
  { id: "qwant", label: "Qwant", region: "海外", url: "https://www.qwant.com/?q=" },
  { id: "swisscows", label: "Swisscows", region: "海外", url: "https://swisscows.com/web?query=" },
  { id: "naver", label: "Naver", region: "海外", url: "https://search.naver.com/search.naver?query=" },
  { id: "kagi", label: "Kagi", region: "海外", url: "https://kagi.com/search?q=" },
  { id: "scholar", label: "Google Scholar", region: "海外", url: "https://scholar.google.com/scholar?q=" },
];

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function importBackupFileName(fileName: string) {
  const base = fileName.replace(/\.(?:json|html?|csv|xlsx)$/i, "") || "bookmark-import";
  return `${base}-import.json`;
}

function firstFolderId(nodes: BookmarkNode[]): string {
  const first = nodes.find(isFolder);
  return first?.id ?? "all";
}

function treeContainsFolder(folder: BookmarkFolder, id: string): boolean {
  return folder.id === id || folder.children.some(node => isFolder(node) && treeContainsFolder(node, id));
}

function BookmarkIcon({ item, source }: { item: BookmarkItem; source: IconSource }) {
  const preferred = item.iconSource ?? source;
  const attempts = [preferred, ...fallbackIconSources.filter(candidate => candidate !== preferred)];
  const [attemptIndex, setAttemptIndex] = useState(0);
  const currentSource = attempts[Math.min(attemptIndex, attempts.length - 1)];
  const url = getFaviconUrl(item, currentSource);

  useEffect(() => setAttemptIndex(0), [item.id, source]);

  return (
    <span className="bookmark-icon" aria-hidden="true">
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setAttemptIndex(index => Math.min(index + 1, attempts.length - 1))}
      />
    </span>
  );
}

function FolderTree({
  folder,
  selectedId,
  expanded,
  onSelect,
  onToggle,
  level = 0,
}: {
  folder: BookmarkFolder;
  selectedId: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  level?: number;
}) {
  const isOpen = expanded.has(folder.id);
  const count = countBookmarks(folder.children);
  return (
    <li>
      <button
        className={`tree-row ${selectedId === folder.id ? "is-selected" : ""}`}
        type="button"
        style={{ paddingLeft: `${12 + level * 14}px` }}
        onClick={() => { onToggle(folder.id); onSelect(folder.id); }}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "收起" : "展开"} ${folder.title}`}
      >
        <span className="tree-expand" aria-hidden="true">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="tree-select">
          {isOpen ? <FolderOpen size={15} /> : <FolderClosed size={15} />}
          <span>{folder.title}</span>
          <small>{count}</small>
        </span>
      </button>
      {isOpen && (
        <ul className="tree-list child-tree">
          {folder.children.filter(isFolder).map(child => (
            <FolderTree key={child.id} folder={child} selectedId={selectedId} expanded={expanded} onSelect={onSelect} onToggle={onToggle} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function BookmarkCard({ item, iconSource, showDescription }: { item: BookmarkItem; iconSource: IconSource; showDescription: boolean }) {
  return (
    <a className="bookmark-card" href={item.url} target="_blank" rel="noreferrer">
      <BookmarkIcon item={item} source={iconSource} />
      <span className="bookmark-body">
        <span className="bookmark-title">{item.title}</span>
        {showDescription && item.description && <span className="bookmark-description">{item.description}</span>}
      </span>
    </a>
  );
}

function FolderSection({
  folder,
  iconSource,
  inheritedShowDescription,
  descriptionOverrides,
  transitionTargetId,
  query,
  level = 0,
  ancestry = [],
}: {
  folder: BookmarkFolder;
  iconSource: IconSource;
  inheritedShowDescription: boolean;
  descriptionOverrides: Record<string, boolean>;
  transitionTargetId: string | null;
  query: string;
  level?: number;
  ancestry?: string[];
}) {
  const search = query.trim().toLowerCase();
  const folderPath = [...ancestry, folder.title];
  const directItems = folder.children
    .filter((node): node is BookmarkItem => !isFolder(node))
    .map(item => ({ ...item, path: folderPath }));
  const matchesSearch = (item: BookmarkItem & { path: string[] }) => `${item.title} ${item.url} ${item.description ?? ""} ${item.path.join(" ")}`.toLowerCase().includes(search);
  const visible = search ? directItems.filter(matchesSearch) : directItems;
  const subtreeItems = flattenBookmarks(folder.children).map(item => ({ ...item, path: [...folderPath, ...item.path] }));
  const subtreeCount = search
    ? subtreeItems.filter(item => `${item.title} ${item.url} ${item.description ?? ""} ${item.path.join(" ")}`.toLowerCase().includes(search)).length
    : subtreeItems.length;
  const childFolders = folder.children.filter(isFolder);
  const showDescription = resolveDescriptionVisibility(folder.id, inheritedShowDescription, descriptionOverrides);

  if (!subtreeCount) return null;
  return (
    <section className={`bookmark-section ${level > 0 ? "is-nested" : ""} ${transitionTargetId === folder.id ? "is-category-transitioning" : ""}`} id={`section-${folder.id}`}>
      <header className="section-heading">
        <span className="section-tab" />
        <h2>{folder.title}</h2>
      </header>
      {visible.length > 0 && (
        <div className="bookmark-grid">
          {visible.map(item => <BookmarkCard key={item.id} item={item} iconSource={iconSource} showDescription={showDescription} />)}
        </div>
      )}
      {childFolders.length > 0 && (
        <div className="nested-bookmark-sections">
          {childFolders.map(child => <FolderSection key={child.id} folder={child} iconSource={iconSource} inheritedShowDescription={showDescription} descriptionOverrides={descriptionOverrides} transitionTargetId={transitionTargetId} query={query} level={level + 1} ancestry={folderPath} />)}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>(() => {
    try {
      const saved = localStorage.getItem("archive-index-bookmarks");
      return saved ? normalizeArchive(JSON.parse(saved)) : sampleBookmarks;
    } catch {
      return sampleBookmarks;
    }
  });
  const [archiveReady, setArchiveReady] = useState(false);
  const [iconSource, setIconSource] = useState<IconSource>(() => {
    const stored = localStorage.getItem("archive-index-icon-source") as IconSource | null;
    return !stored || stored === "google" ? "favicon_im" : stored;
  });
  const [selectedFolder, setSelectedFolder] = useState(() => firstFolderId(sampleBookmarks));
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(flattenFolders(sampleBookmarks)));
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState("bing");
  const [showTools, setShowTools] = useState(false);
  const [showDataTools, setShowDataTools] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("manage");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState(ROOT_FOLDER_ID);
  const [renameFolderTitle, setRenameFolderTitle] = useState("");
  const [folderMoveTarget, setFolderMoveTarget] = useState(ROOT_FOLDER_ID);
  const [bookmarkDraft, setBookmarkDraft] = useState<BookmarkDraft>(emptyBookmarkDraft);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<Set<string>>(new Set());
  const [batchMoveTarget, setBatchMoveTarget] = useState(ROOT_FOLDER_ID);
  const [bookmarkManagerQuery, setBookmarkManagerQuery] = useState("");
  const [bookmarkManagerLimit, setBookmarkManagerLimit] = useState(240);
  const [showTop, setShowTop] = useState(false);
  const [showWebsiteDescriptions, setShowWebsiteDescriptions] = useState(() => localStorage.getItem("archive-index-show-descriptions") === "true");
  const [descriptionLineLimit, setDescriptionLineLimit] = useState<DescriptionLineLimit>(() => coerceDescriptionLineLimit(localStorage.getItem("archive-index-description-lines")));
  const [cardDensity, setCardDensity] = useState<CardDensity>(() => localStorage.getItem("archive-index-card-density") === "compact" ? "compact" : "spacious");
  const [folderDescriptionOverrides, setFolderDescriptionOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem("archive-index-folder-description-overrides") ?? "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, value]) => typeof value === "boolean")) as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [descriptionOverrideFolderId, setDescriptionOverrideFolderId] = useState("");
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [pendingExport, setPendingExport] = useState<ExportKind | null>(null);
  const [exportUsername, setExportUsername] = useState("");
  const [exportPassword, setExportPassword] = useState("");
  const [exportAuthorized, setExportAuthorized] = useState(() => localStorage.getItem(EXPORT_AUTH_STORAGE_KEY) === "true");
  const [spreadsheetPathSeparator, setSpreadsheetPathSeparator] = useState(defaultSpreadsheetPathSeparator);
  const [categoryTransitionTarget, setCategoryTransitionTarget] = useState<string | null>(null);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const dataToolsTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryTransitionTimer = useRef<number | null>(null);
  const cloudBackups = trpc.bookmarkBackups.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const saveCloudBackup = trpc.bookmarkBackups.save.useMutation({
    onSuccess: async result => {
      await cloudBackups.refetch();
      toast.success("已保存云端备份", { description: `${result.fileName} · ${result.bookmarkCount} 个入口` });
    },
    onError: error => {
      toast.error("云端备份未保存", { description: error.message });
    },
  });
  const accessCloudBackup = trpc.bookmarkBackups.access.useMutation();
  const externalBackupStatus = trpc.externalBackups.status.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const saveExternalBackup = trpc.externalBackups.save.useMutation({
    onSuccess: result => toast.success("已创建外部备份", { description: `备份目标：${result.target} · ${result.location}` }),
    onError: error => toast.error("外部备份未完成", { description: error.message }),
  });

  const topFolders = useMemo(() => {
    const rootBookmarks = bookmarks.filter(node => !isFolder(node));
    const folders = bookmarks.filter(isFolder);
    return rootBookmarks.length ? [{ id: "root-ungrouped", type: "folder" as const, title: "未分类书签", children: rootBookmarks }, ...folders] : folders;
  }, [bookmarks]);
  const totalBookmarks = useMemo(() => countBookmarks(bookmarks), [bookmarks]);
  const allItems = useMemo(() => flattenBookmarks(bookmarks), [bookmarks]);
  const isFiltering = query.trim().length > 0;
  const activeFolders = topFolders;
  const folderOptions = useMemo(() => listFolderOptions(bookmarks), [bookmarks]);
  const selectedDescriptionOverrideFolder = folderOptions.find(folder => folder.id === descriptionOverrideFolderId);
  const selectedDescriptionOverrideValue = descriptionOverrideFolderId ? folderDescriptionOverrides[descriptionOverrideFolderId] : undefined;
  const manageableBookmarks = useMemo(() => flattenBookmarks(bookmarks), [bookmarks]);
  const filteredManageableBookmarks = useMemo(() => {
    const normalized = bookmarkManagerQuery.trim().toLowerCase();
    if (!normalized) return manageableBookmarks;
    return manageableBookmarks.filter(item => `${item.title} ${item.url} ${item.description ?? ""} ${item.path.join(" ")}`.toLowerCase().includes(normalized));
  }, [bookmarkManagerQuery, manageableBookmarks]);
  const visibleManageableBookmarks = useMemo(() => filteredManageableBookmarks.slice(0, bookmarkManagerLimit), [bookmarkManagerLimit, filteredManageableBookmarks]);
  const matchedItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allItems;
    return allItems.filter(item => `${item.title} ${item.url} ${item.description ?? ""} ${item.path.join(" ")}`.toLowerCase().includes(normalized));
  }, [allItems, query]);

  useEffect(() => {
    let cancelled = false;

    const applyArchive = (next: BookmarkNode[]) => {
      if (cancelled) return;
      setBookmarks(next);
      setSelectedFolder(firstFolderId(next));
      setExpandedFolders(new Set(flattenFolders(next)));
    };

    async function loadDefaultBookmarks() {
      let saved: BookmarkNode[] | null = null;
      let storedVersion: string | null = null;
      let explicitlyCleared = false;

      try {
        const raw = localStorage.getItem("archive-index-bookmarks");
        saved = raw ? normalizeArchive(JSON.parse(raw)) : null;
        storedVersion = localStorage.getItem("archive-index-default-version");
        explicitlyCleared = localStorage.getItem("archive-index-cleared") === "true";
      } catch {
        saved = null;
      }

      const isLegacySample = Boolean(saved && countBookmarks(saved) === countBookmarks(sampleBookmarks));
      const shouldApplyDefault = !saved || (!explicitlyCleared && saved.length === 0) || (!storedVersion && isLegacySample);

      if (!shouldApplyDefault) {
        if (saved) applyArchive(saved);
        if (!cancelled) setArchiveReady(true);
        return;
      }

      try {
        const response = await fetch(DEFAULT_BOOKMARKS_URL);
        if (!response.ok) throw new Error("默认数据加载失败");
        const payload = await response.json();
        const defaults = normalizeArchive(payload.bookmarks ?? payload);
        if (!defaults.length) throw new Error("默认数据为空");
        applyArchive(defaults);
        localStorage.setItem("archive-index-bookmarks", JSON.stringify(defaults));
        localStorage.setItem("archive-index-default-version", DEFAULT_DATA_VERSION);
      } catch {
        if (saved) applyArchive(saved);
      } finally {
        if (!cancelled) setArchiveReady(true);
      }
    }

    loadDefaultBookmarks();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!archiveReady) return;
    localStorage.setItem("archive-index-bookmarks", JSON.stringify(bookmarks));
  }, [archiveReady, bookmarks]);

  useEffect(() => {
    localStorage.setItem("archive-index-icon-source", iconSource);
  }, [iconSource]);

  useEffect(() => {
    localStorage.setItem("archive-index-show-descriptions", String(showWebsiteDescriptions));
  }, [showWebsiteDescriptions]);

  useEffect(() => {
    localStorage.setItem("archive-index-description-lines", String(descriptionLineLimit));
  }, [descriptionLineLimit]);

  useEffect(() => {
    localStorage.setItem("archive-index-card-density", cardDensity);
  }, [cardDensity]);

  useEffect(() => {
    localStorage.setItem("archive-index-folder-description-overrides", JSON.stringify(folderDescriptionOverrides));
  }, [folderDescriptionOverrides]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => () => {
    if (categoryTransitionTimer.current) window.clearTimeout(categoryTransitionTimer.current);
  }, []);

  function toggleFolder(id: string) {
    setExpandedFolders(previous => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectFolder(id: string) {
    setSelectedFolder(id);
    setCategoryTransitionTarget(id);
    if (categoryTransitionTimer.current) window.clearTimeout(categoryTransitionTimer.current);
    categoryTransitionTimer.current = window.setTimeout(() => {
      setCategoryTransitionTarget(current => current === id ? null : current);
      categoryTransitionTimer.current = null;
    }, 260);
    window.setTimeout(() => {
      const target = id === "all" ? document.getElementById("bookmark-collection") : document.getElementById(`section-${id}`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function expandAllFolders() {
    setExpandedFolders(new Set(flattenFolders(bookmarks)));
  }

  function collapseAllFolders() {
    setExpandedFolders(new Set());
  }

  function applyManagedTree(next: BookmarkNode[], success: string) {
    setBookmarks(next);
    setSelectedFolder(firstFolderId(next));
    setExpandedFolders(new Set(flattenFolders(next)));
    if (next.length) localStorage.removeItem("archive-index-cleared");
    toast.success(success);
  }

  function handleCreateFolder() {
    try {
      const next = createManagedFolder(bookmarks, newFolderTitle, newFolderParentId);
      applyManagedTree(next, "已创建分类");
      setNewFolderTitle("");
    } catch (error) {
      toast.error("无法创建分类", { description: error instanceof Error ? error.message : "请检查分类信息。" });
    }
  }

  function selectManagedFolder(id: string) {
    const folder = findBookmarkNode(bookmarks, id);
    if (!folder || !isFolder(folder)) return;
    setActiveFolderId(id);
    setRenameFolderTitle(folder.title);
    setFolderMoveTarget(ROOT_FOLDER_ID);
  }

  function handleRenameFolder() {
    if (!activeFolderId) return;
    try {
      applyManagedTree(renameBookmarkNode(bookmarks, activeFolderId, renameFolderTitle), "已重命名分类");
    } catch (error) {
      toast.error("无法重命名分类", { description: error instanceof Error ? error.message : "请检查名称。" });
    }
  }

  function handleRemoveFolder() {
    if (!activeFolderId) return;
    const folder = findBookmarkNode(bookmarks, activeFolderId);
    if (!folder || !isFolder(folder)) return;
    if (!window.confirm(`删除“${folder.title}”及其全部子分类和书签？此操作不能撤销。`)) return;
    applyManagedTree(removeBookmarkNodes(bookmarks, [activeFolderId]), "已删除分类及其中内容");
    setActiveFolderId(null);
    setRenameFolderTitle("");
  }

  function handleMoveFolder(targetId: string) {
    if (!activeFolderId) return;
    try {
      applyManagedTree(moveBookmarkNodes(bookmarks, [activeFolderId], targetId), "已移动分类");
    } catch (error) {
      toast.error("无法移动分类", { description: error instanceof Error ? error.message : "请检查目标分类。" });
    }
  }

  function handleCreateOrUpdateBookmark() {
    try {
      if (editingBookmarkId) {
        const updated = updateManagedBookmark(bookmarks, editingBookmarkId, bookmarkDraft);
        const moved = moveBookmarkNodes(updated, [editingBookmarkId], bookmarkDraft.parentId);
        applyManagedTree(moved, "已保存书签修改");
      } else {
        applyManagedTree(createManagedBookmark(bookmarks, bookmarkDraft, bookmarkDraft.parentId), "已创建书签");
      }
      setBookmarkDraft(emptyBookmarkDraft());
      setEditingBookmarkId(null);
    } catch (error) {
      toast.error("无法保存书签", { description: error instanceof Error ? error.message : "请检查书签信息。" });
    }
  }

  function beginEditBookmark(id: string) {
    const item = findBookmarkNode(bookmarks, id);
    if (!item || isFolder(item)) return;
    const path = manageableBookmarks.find(bookmark => bookmark.id === id)?.path ?? [];
    const parent = folderOptions.find(option => option.path === path.join(" / "))?.id ?? ROOT_FOLDER_ID;
    setEditingBookmarkId(id);
    setBookmarkDraft({ title: item.title, url: item.url, description: item.description ?? "", parentId: parent });
  }

  function toggleSelectedBookmark(id: string) {
    setSelectedBookmarkIds(previous => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBatchDelete() {
    if (!selectedBookmarkIds.size) return;
    if (!window.confirm(`删除所选 ${selectedBookmarkIds.size} 个书签？此操作不能撤销。`)) return;
    applyManagedTree(removeBookmarkNodes(bookmarks, selectedBookmarkIds), `已删除 ${selectedBookmarkIds.size} 个书签`);
    setSelectedBookmarkIds(new Set());
  }

  function handleBatchMove() {
    if (!selectedBookmarkIds.size) return;
    try {
      applyManagedTree(moveBookmarkNodes(bookmarks, selectedBookmarkIds, batchMoveTarget), `已移动 ${selectedBookmarkIds.size} 个书签`);
      setSelectedBookmarkIds(new Set());
    } catch (error) {
      toast.error("无法批量移动书签", { description: error instanceof Error ? error.message : "请检查目标分类。" });
    }
  }

  async function restoreFactoryDefaults() {
    if (!window.confirm("恢复出厂默认数据会覆盖当前浏览器中的全部书签。是否继续？")) return;
    try {
      const response = await fetch(DEFAULT_BOOKMARKS_URL);
      if (!response.ok) throw new Error("默认数据读取失败。");
      const payload = await response.json();
      applyManagedTree(normalizeArchive(payload.bookmarks ?? payload), "已恢复默认书签数据");
      localStorage.setItem("archive-index-default-version", DEFAULT_DATA_VERSION);
    } catch (error) {
      toast.error("恢复默认数据失败", { description: error instanceof Error ? error.message : "请稍后重试。" });
    }
  }

  function clearAllBookmarks() {
    if (!window.confirm("清除会删除当前浏览器中的所有书签。你可先创建本地或云端备份。是否继续？")) return;
    localStorage.setItem("archive-index-cleared", "true");
    applyManagedTree([], "已清除当前浏览器书签");
    setSelectedBookmarkIds(new Set());
  }

  function explainExternalBackup(provider: "nutstore" | "cloudflare") {
    const description = provider === "nutstore"
      ? "坚果云备份需要 WebDAV 地址、账户和应用密码；配置后将由服务端写入专用备份目录。"
      : "Cloudflare KV 需要账户 ID、API 令牌和 KV 命名空间；D1 需要受认证 Worker 代理 URL 与代理令牌。配置后由服务端发起请求。";
    toast.message("外部备份尚未连接", { description });
  }

  function runExternalSearch() {
    const words = query.trim();
    if (!words) {
      toast.message("请先输入搜索词", { description: "输入内容后可使用所选搜索引擎检索全网。" });
      return;
    }
    const selected = searchEngines.find(item => item.id === engine) ?? searchEngines[0];
    window.open(`${selected.url}${encodeURIComponent(words)}`, "_blank", "noopener,noreferrer");
  }

  async function importBookmarks(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const lowerName = file.name.toLowerCase();
      const isJson = lowerName.endsWith(".json");
      const isSpreadsheet = lowerName.endsWith(".xlsx") || lowerName.endsWith(".csv");
      const next = isJson
        ? parseBookmarkJson(JSON.parse(await file.text()))
        : isSpreadsheet
          ? await parseBookmarkSpreadsheetFile(file, spreadsheetPathSeparator)
          : parseBrowserBookmarkHtml(await file.text());
      setPendingImport({ nodes: next, fileName: file.name, source: isJson ? "json" : isSpreadsheet ? "spreadsheet" : "html", preview: createBookmarkImportPreview(next) });
    } catch (error) {
      toast.error("导入未完成", { description: error instanceof Error ? error.message : "无法读取该文件。" });
    } finally {
      event.target.value = "";
    }
  }

  function previewMultiLevelExample() {
    const nodes = normalizeArchive({ bookmarks: sampleBookmarks });
    setShowDataTools(false);
    setPendingImport({
      nodes,
      fileName: "多级分类示例（仅预览，尚未写入）",
      source: "spreadsheet",
      preview: createBookmarkImportPreview(nodes),
    });
  }

  function applyImport(mode: "replace" | "merge") {
    if (!pendingImport) return;
    const imported = pendingImport;
    const next = mode === "replace" ? imported.nodes : mergeBookmarkNodes(bookmarks, imported.nodes);
    setBookmarks(next);
    setSelectedFolder(firstFolderId(next));
    setExpandedFolders(new Set(flattenFolders(next)));
    setMobileTreeOpen(true);
    setPendingImport(null);
    toast.success(mode === "replace" ? "书签已覆盖导入" : "书签已增量导入", {
      description: mode === "replace" ? `已按原始层级与顺序建立 ${countBookmarks(next)} 个入口。` : "已合并同名分类，按 URL 去重，并保留原有顺序。",
    });
    const backupContent = JSON.stringify(archiveForExport(next, iconSource), null, 2);
    if (isAuthenticated) {
      saveCloudBackup.mutate({ fileName: importBackupFileName(imported.fileName), content: backupContent, source: "import" });
    } else {
      const sourceLabel = imported.source === "spreadsheet" ? "表格数据" : imported.source === "html" ? "浏览器书签" : "JSON 数据";
      toast.message(`${sourceLabel}已导入本地`, { description: "登录后可使用“同步当前数据”将当前书签保存为云端备份。" });
    }
  }

  async function syncCurrentBookmarks() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await saveCloudBackup.mutateAsync({
      fileName: `bookmark-snapshot-${stamp}.json`,
      content: JSON.stringify(archiveForExport(bookmarks, iconSource), null, 2),
      source: "snapshot",
    });
  }

  async function syncExternalBackup(target: "nutstore" | "cloudflare_kv" | "cloudflare_d1") {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const status = externalBackupStatus.data;
    const enabled = target === "nutstore" ? status?.nutstore : target === "cloudflare_kv" ? status?.cloudflareKv : status?.cloudflareD1;
    if (!enabled) {
      toast.message("尚未完成安全配置", { description: "请在项目管理面板的密钥设置中保存对应服务的凭据。密钥不会存入浏览器，也不会在此页面回显。" });
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await saveExternalBackup.mutateAsync({
      target,
      fileName: `bookmark-external-${stamp}.json`,
      content: JSON.stringify(archiveForExport(bookmarks, iconSource), null, 2),
    });
  }

  async function restoreCloudBackup(id: number) {
    try {
      const backup = await accessCloudBackup.mutateAsync({ id });
      const response = await fetch(backup.url);
      if (!response.ok) throw new Error("无法读取云端备份文件。");
      const next = normalizeArchive(await response.json());
      setBookmarks(next);
      setSelectedFolder(firstFolderId(next));
      setExpandedFolders(new Set(flattenFolders(next)));
      setMobileTreeOpen(true);
      toast.success("已恢复云端备份", { description: `${backup.fileName} · ${backup.bookmarkCount} 个入口已写入当前浏览器。` });
    } catch (error) {
      toast.error("恢复云端备份失败", { description: error instanceof Error ? error.message : "请稍后重试。" });
    }
  }

  function exportJson() {
    downloadFile("bookmark-archive.json", JSON.stringify(archiveForExport(bookmarks, iconSource), null, 2), "application/json;charset=utf-8");
    toast.success("已导出 JSON 数据");
  }

  function exportHtml() {
    downloadFile("browser-bookmarks.html", toBrowserBookmarkHtml(bookmarks), "text/html;charset=utf-8");
    toast.success("已导出浏览器书签 HTML");
  }

  async function exportSpreadsheet(format: "xlsx" | "csv") {
    try {
      const extension = format === "xlsx" ? "xlsx" : "csv";
      const blob = await createBookmarkSpreadsheetBlob(bookmarks, format);
      downloadBlob(`bookmark-archive.${extension}`, blob);
      toast.success(`已导出 ${format === "xlsx" ? "XLSX" : "CSV"} 数据`, { description: "表格中的“分类路径”可在导入时自动还原为多级分类。" });
    } catch (error) {
      toast.error("表格导出未完成", { description: error instanceof Error ? error.message : "无法生成表格文件。" });
    }
  }

  async function downloadSpreadsheetTemplate(format: "xlsx" | "csv") {
    try {
      const blob = await createBlankBookmarkSpreadsheetBlob(format);
      downloadBlob(`bookmark-import-template.${format}`, blob);
      toast.success(`已下载 ${format.toUpperCase()} 空白模板`, { description: "请至少填写“名称”和以 http:// 或 https:// 开头的“网址”；“分类路径”使用 / 分隔多级目录。" });
    } catch (error) {
      toast.error("模板下载未完成", { description: error instanceof Error ? error.message : "无法生成空白模板。" });
    }
  }

  async function downloadMultiLevelSpreadsheetExample(format: "xlsx" | "csv") {
    try {
      const blob = await createMultiLevelBookmarkSpreadsheetExampleBlob(format);
      downloadBlob(`bookmark-multilevel-category-example.${format}`, blob);
      toast.success(`已下载 ${format.toUpperCase()} 多级分类示例`, { description: "请查看“分类路径”列中的“效率工作台 / 写作与协作”等层级写法。" });
    } catch (error) {
      toast.error("示例下载未完成", { description: error instanceof Error ? error.message : "无法生成多级分类示例。" });
    }
  }

  async function exportStandalone() {
    try {
      const { default: xlsxBundle } = await import("xlsx/dist/xlsx.full.min.js?raw");
      downloadFile("bookmark-navigation.html", createStandaloneNavigation(bookmarks, iconSource, xlsxBundle), "text/html;charset=utf-8");
      toast.success("已导出单页导航", { description: "该 HTML 文件可本地双击打开，并保留搜索、分类、主题及 XLSX、CSV 数据工具。" });
    } catch (error) {
      toast.error("单页导航导出未完成", { description: error instanceof Error ? error.message : "无法嵌入表格工具。" });
    }
  }

  async function performExport(kind: ExportKind) {
    if (kind === "json") exportJson();
    if (kind === "html") exportHtml();
    if (kind === "xlsx") await exportSpreadsheet("xlsx");
    if (kind === "csv") await exportSpreadsheet("csv");
    if (kind === "standalone") await exportStandalone();
  }

  function requestExport(kind: ExportKind) {
    if (exportAuthorized) {
      void performExport(kind);
      return;
    }
    setExportUsername("");
    setExportPassword("");
    setPendingExport(kind);
  }

  function verifyAndExport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (exportUsername !== EXPORT_USERNAME || exportPassword !== EXPORT_PASSWORD) {
      toast.error("账号或密码不正确", { description: "请使用导出账号后再次尝试。" });
      return;
    }
    const selectedExport = pendingExport;
    localStorage.setItem(EXPORT_AUTH_STORAGE_KEY, "true");
    setExportAuthorized(true);
    setPendingExport(null);
    setExportPassword("");
    if (selectedExport) void performExport(selectedExport);
  }

  function logoutExportAuthorization() {
    localStorage.removeItem(EXPORT_AUTH_STORAGE_KEY);
    setExportAuthorized(false);
    toast.success("已退出导出验证", { description: "下一次导出时需要重新输入账号和密码。" });
  }

  return (
    <div className={`archive-shell ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <aside className="archive-sidebar">
        <div className="brand-lockup">
          <img src={LOGO_URL} alt="书签导航标记" className="brand-logo" />
          <div>
            <strong>书签导航</strong>
            <span>ARCHIVE INDEX</span>
          </div>
          <button className="sidebar-toggle" type="button" onClick={() => setSidebarCollapsed(collapsed => !collapsed)} aria-label={sidebarCollapsed ? "展开左侧分类面板" : "折叠左侧分类面板"}>
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="archive-nav" aria-label="书签分类">
          <p className="eyebrow">我的索引</p>
          <button className={`all-bookmarks ${selectedFolder === "all" || isFiltering ? "is-selected" : ""}`} type="button" onClick={() => selectFolder("all")}>
            <Archive size={16} />
            <span>全部书签</span>
            <small>{totalBookmarks}</small>
          </button>
          <div className="tree-actions" aria-label="分类展开控制">
            <button type="button" onClick={expandAllFolders}>全部展开</button>
            <button type="button" onClick={collapseAllFolders}>全部收起</button>
          </div>
          <div className="tree-scroll">
            <ul className="tree-list">
              {topFolders.map(folder => <FolderTree key={folder.id} folder={folder} selectedId={selectedFolder} expanded={expandedFolders} onSelect={selectFolder} onToggle={toggleFolder} />)}
            </ul>
          </div>
        </nav>

        <div className="sidebar-footnote">
          <span className="archive-rule" />
          <p>共收录 <strong>{totalBookmarks}</strong> 个常用入口</p>
          <p>本地使用；登录后可云端备份。</p>
        </div>
      </aside>

      <main className="archive-main">
        <header className="topbar">
          <div className="topbar-intro">
            <span className="topbar-index">A–01 / 2026</span>
            <span>个人入口资料馆 · CATALOGUE</span>
          </div>
          <div className="topbar-actions">
            <button ref={dataToolsTriggerRef} className="tool-trigger data-tools-trigger" type="button" onClick={() => setShowDataTools(true)} aria-haspopup="dialog">
              <FileArchive size={16} />
              <span>数据工具</span>
              <ChevronDown size={14} />
            </button>
            <button ref={settingsTriggerRef} className="tool-trigger" type="button" onClick={() => setShowTools(true)} aria-haspopup="dialog">
              <Settings size={16} />
              <span>设置</span>
              <ChevronDown size={14} />
            </button>
            <button className={`density-quick-toggle ${cardDensity === "compact" ? "is-compact" : "is-spacious"}`} type="button" onClick={() => setCardDensity(current => current === "compact" ? "spacious" : "compact")} aria-pressed={cardDensity === "compact"} aria-label={`当前为${cardDensity === "compact" ? "紧凑" : "舒展"}卡片视图，点击切换为${cardDensity === "compact" ? "舒展" : "紧凑"}视图`} title={`切换为${cardDensity === "compact" ? "舒展" : "紧凑"}卡片视图`}>
              <LayoutGrid size={16} />
              <span>{cardDensity === "compact" ? "紧凑" : "舒展"}</span>
            </button>
            <button className="theme-switch" type="button" onClick={toggleTheme} aria-label="切换日夜模式">
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              <span>{theme === "light" ? "夜阅" : "日阅"}</span>
            </button>
          </div>
        </header>

        <Dialog open={showDataTools} onOpenChange={setShowDataTools}>
          <DialogContent className="data-tools-modal" showCloseButton={false} onCloseAutoFocus={event => {
            event.preventDefault();
            dataToolsTriggerRef.current?.focus();
          }}>
            <header className="data-tools-head">
              <div>
                <span className="eyebrow">DATA TOOLS</span>
                <DialogTitle className="data-tools-title">导入与导出</DialogTitle>
                <DialogDescription className="data-tools-description">使用本地文件整理、备份或迁移书签。导入后可选择覆盖或递归增量合并，并自动生成多级分类。</DialogDescription>
              </div>
              <DialogClose asChild><button className="settings-close" type="button" aria-label="关闭数据工具"><X size={20} /></button></DialogClose>
            </header>
            <div className="data-tools-body">
              <section className="data-tools-section">
                <div className="data-tools-section-head"><span className="eyebrow">IMPORT</span><h3>导入书签数据</h3></div>
                <button className="data-tool-primary" type="button" onClick={() => { setShowDataTools(false); importRef.current?.click(); }}><FileUp size={17} />选择 JSON / HTML / XLSX / CSV 文件</button>
                <p>支持浏览器书签 HTML、本站归档 JSON、极光 Tab 原始 JSON、WebDesk 原始 JSON 和表格文件。解析后会先显示数据摘要与样本，确认后才会写入页面。</p>
                <div className="spreadsheet-import-controls"><label><span>分类路径分隔符</span><input value={spreadsheetPathSeparator} maxLength={3} onChange={event => setSpreadsheetPathSeparator(event.target.value || defaultSpreadsheetPathSeparator)} aria-describedby="spreadsheet-separator-help" /><small id="spreadsheet-separator-help">默认 <code>/</code>；也可输入 <code>&gt;</code>、<code>|</code>、<code>→</code> 等字符。</small></label><button type="button" onClick={previewMultiLevelExample}><FileSpreadsheet size={15} />导入示例到预览</button></div>
                <details className="spreadsheet-field-help"><summary><CircleHelp size={15} />表格字段在线说明</summary><dl>{spreadsheetFieldHelp.map(item => <div key={item.field}><dt>{item.field}</dt><dd>{item.detail}</dd></div>)}</dl></details>
                <div className="template-downloads"><span>多级分类示例：</span><button type="button" onClick={() => void downloadMultiLevelSpreadsheetExample("xlsx")} title="下载多级分类 XLSX 示例"><FileSpreadsheet size={14} />XLSX 示例</button><button type="button" onClick={() => void downloadMultiLevelSpreadsheetExample("csv")} title="下载多级分类 CSV 示例"><FileSpreadsheet size={14} />CSV 示例</button><span>首次录入可下载空白模板：</span><button type="button" onClick={() => void downloadSpreadsheetTemplate("xlsx")}><FileSpreadsheet size={14} />XLSX 模板</button><button type="button" onClick={() => void downloadSpreadsheetTemplate("csv")}><FileSpreadsheet size={14} />CSV 模板</button></div>
              </section>
              <section className="data-tools-section">
                <div className="data-tools-section-head"><span className="eyebrow">EXPORT</span><h3>导出当前书签</h3></div>
                <div className="data-export-grid">
                  <button type="button" onClick={() => { setShowDataTools(false); requestExport("json"); }}><FileJson2 size={16} /><span>JSON</span><small>完整备份</small></button>
                  <button type="button" onClick={() => { setShowDataTools(false); requestExport("html"); }}><FileArchive size={16} /><span>浏览器 HTML</span><small>Chrome / Edge / Firefox</small></button>
                  <button type="button" onClick={() => { setShowDataTools(false); requestExport("xlsx"); }}><FileSpreadsheet size={16} /><span>XLSX</span><small>表格编辑</small></button>
                  <button type="button" onClick={() => { setShowDataTools(false); requestExport("csv"); }}><FileSpreadsheet size={16} /><span>CSV</span><small>通用交换</small></button>
                  <button type="button" onClick={() => { setShowDataTools(false); requestExport("standalone"); }}><Download size={16} /><span>离线导航</span><small>独立 HTML 页面</small></button>
                </div>
                <p className="export-auth-status">{exportAuthorized ? <>导出验证已通过，可直接下载。<button type="button" className="export-logout" onClick={logoutExportAuthorization}>退出登录</button></> : <>所有导出需输入账号 <strong>admin</strong> 与密码 <strong>123456</strong>。</>}</p>
              </section>
              <button className="data-tools-settings-link" type="button" onClick={() => { setShowDataTools(false); setShowTools(true); setSettingsTab("backup"); }}><Settings size={15} />更多备份、云端恢复与数据维护，请前往设置</button>
            </div>
          </DialogContent>
        </Dialog>

        {pendingExport && (
          <div className="import-overlay" role="dialog" aria-modal="true" aria-labelledby="export-auth-title">
            <form className="import-choice export-auth" onSubmit={verifyAndExport}>
              <span className="eyebrow">EXPORT LOGIN</span>
              <h2 id="export-auth-title">登录后导出{pendingExport === "json" ? " JSON 数据" : pendingExport === "html" ? "书签 HTML" : pendingExport === "xlsx" ? " XLSX 数据" : pendingExport === "csv" ? " CSV 数据" : "单页导航"}</h2>
              <p>此验证只用于当前浏览器的数据工具导出；验证成功后可直接导出，直到你选择退出登录。</p>
              <div className="export-credential-fields">
                <label>账号<input value={exportUsername} onChange={event => setExportUsername(event.target.value)} autoComplete="username" placeholder="请输入账号" required /></label>
                <label>密码<input value={exportPassword} onChange={event => setExportPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="请输入密码" required /></label>
              </div>
              <div className="export-auth-actions">
                <button className="confirm-export" type="submit">登录并导出</button>
                <button className="import-cancel" type="button" onClick={() => setPendingExport(null)}>取消</button>
              </div>
            </form>
          </div>
        )}

        <nav className="responsive-index" aria-label="移动端书签分类">
          <button type="button" className={selectedFolder === "all" || isFiltering ? "is-active" : ""} onClick={() => selectFolder("all")}>
            全部 <span>{totalBookmarks}</span>
          </button>
          {topFolders.map(folder => (
            <button key={folder.id} type="button" className={selectedFolder === folder.id ? "is-active" : ""} onClick={() => selectFolder(folder.id)}>
              {folder.title} <span>{countBookmarks(folder.children)}</span>
            </button>
          ))}
          <button type="button" className="responsive-tree-trigger" onClick={() => setMobileTreeOpen(open => !open)} aria-expanded={mobileTreeOpen}>
            目录 {mobileTreeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </nav>

        {mobileTreeOpen && (
          <section className="mobile-tree-panel" aria-label="完整书签分类目录">
            <div className="mobile-tree-head">
              <span className="eyebrow">完整分类目录</span>
              <div>
                <button type="button" onClick={expandAllFolders}>展开全部</button>
                <button type="button" onClick={collapseAllFolders}>收起全部</button>
              </div>
            </div>
            <ul className="tree-list">
              {topFolders.map(folder => (
                <FolderTree
                  key={folder.id}
                  folder={folder}
                  selectedId={selectedFolder}
                  expanded={expandedFolders}
                  onSelect={id => { selectFolder(id); setMobileTreeOpen(false); }}
                  onToggle={toggleFolder}
                />
              ))}
            </ul>
          </section>
        )}

        <Dialog open={showTools} onOpenChange={setShowTools}>
          <DialogContent className="settings-modal max-w-none gap-0 p-0" showCloseButton={false} onCloseAutoFocus={event => {
            event.preventDefault();
            settingsTriggerRef.current?.focus();
          }}>
            <section>
              <header className="settings-modal-head">
                <div>
                  <span className="eyebrow">ARCHIVE SETTINGS</span>
                  <DialogTitle className="settings-dialog-title">管理你的导航资料馆</DialogTitle>
                  <DialogDescription className="settings-dialog-description">分类、书签、备份与恢复操作都会立即写入当前浏览器；登录后可同步为私有云端备份。</DialogDescription>
                </div>
                <DialogClose asChild><button className="settings-close" type="button" aria-label="关闭设置"><X size={20} /></button></DialogClose>
              </header>

              <nav className="settings-tabs" aria-label="设置分类">
                <button type="button" className={settingsTab === "manage" ? "is-active" : ""} onClick={() => setSettingsTab("manage")}><FolderPlus size={15} />分类管理</button>
                <button type="button" className={settingsTab === "bookmarks" ? "is-active" : ""} onClick={() => setSettingsTab("bookmarks")}><BookmarkPlus size={15} />书签管理</button>
                <button type="button" className={settingsTab === "backup" ? "is-active" : ""} onClick={() => setSettingsTab("backup")}><Cloud size={15} />备份与恢复</button>
                <button type="button" className={settingsTab === "external" ? "is-active" : ""} onClick={() => setSettingsTab("external")}><Settings size={15} />外部备份</button>
              </nav>

              <div className="settings-modal-body">
                {settingsTab === "manage" && (
                  <section className="settings-panel" aria-label="分类管理">
                    <div className="settings-panel-copy"><span>CATALOGUE</span><h3>分类结构</h3><p>创建、重命名、移动、排序或删除分类。删除分类会同时删除其下的全部书签。</p></div>
                    <div className="settings-grid two-columns">
                      <article className="settings-card">
                        <h4>新建分类</h4>
                        <label>分类名称<input value={newFolderTitle} onChange={event => setNewFolderTitle(event.target.value)} placeholder="例如：设计灵感" /></label>
                        <label>放入位置<select value={newFolderParentId} onChange={event => setNewFolderParentId(event.target.value)}><option value={ROOT_FOLDER_ID}>顶层分类</option>{folderOptions.map(folder => <option key={folder.id} value={folder.id}>{"　".repeat(folder.depth)}{folder.path}</option>)}</select></label>
                        <button className="settings-primary" type="button" onClick={handleCreateFolder}><Plus size={15} />创建分类</button>
                      </article>
                      <article className="settings-card folder-editor">
                        <h4>编辑现有分类</h4>
                        <div className="folder-option-list">
                          {folderOptions.map(folder => <button key={folder.id} type="button" className={activeFolderId === folder.id ? "is-selected" : ""} onClick={() => selectManagedFolder(folder.id)}>{"　".repeat(folder.depth)}{folder.title}</button>)}
                        </div>
                        {activeFolderId ? <>
                          <label>分类名称<input value={renameFolderTitle} onChange={event => setRenameFolderTitle(event.target.value)} /></label>
                          <div className="inline-actions"><button type="button" onClick={handleRenameFolder}><Pencil size={14} />重命名</button><button type="button" className="danger-button" onClick={handleRemoveFolder}><Trash2 size={14} />删除</button></div>
                          <label>移动至<select value={folderMoveTarget} onChange={event => setFolderMoveTarget(event.target.value)}><option value={ROOT_FOLDER_ID}>顶层分类</option>{folderOptions.filter(folder => folder.id !== activeFolderId).map(folder => <option key={folder.id} value={folder.id}>{folder.path}</option>)}</select></label>
                          <div className="inline-actions"><button type="button" onClick={() => handleMoveFolder(folderMoveTarget)}><Move size={14} />移动</button><button type="button" onClick={() => applyManagedTree(reorderBookmarkNode(bookmarks, activeFolderId, -1), "已上移分类")}>上移</button><button type="button" onClick={() => applyManagedTree(reorderBookmarkNode(bookmarks, activeFolderId, 1), "已下移分类")}>下移</button></div>
                        </> : <p className="settings-hint">从左侧目录选择一个分类后可进行编辑。</p>}
                      </article>
                      <article className="settings-card display-preferences-card">
                        <h4>网址模块显示</h4>
                        <label className="setting-checkbox"><input type="checkbox" checked={showWebsiteDescriptions} onChange={event => setShowWebsiteDescriptions(event.target.checked)} /><span><strong>显示网站描述</strong><small>启用后，右侧网址卡片会显示书签的“说明”字段；没有说明的卡片保持简洁。</small></span></label>
                        <label>描述最大行数<select value={descriptionLineLimit} disabled={!showWebsiteDescriptions} onChange={event => setDescriptionLineLimit(coerceDescriptionLineLimit(event.target.value))}>{([1, 2, 3, 4] as const).map(limit => <option key={limit} value={limit}>最多 {limit} 行</option>)}</select></label>
                        <div className="density-toggle"><span>卡片显示密度</span><div role="group" aria-label="卡片显示密度"><button type="button" className={cardDensity === "compact" ? "is-active" : ""} onClick={() => setCardDensity("compact")}>紧凑</button><button type="button" className={cardDensity === "spacious" ? "is-active" : ""} onClick={() => setCardDensity("spacious")}>舒展</button></div><small>紧凑模式展示更多入口；舒展模式为标题与描述保留更多留白。</small></div>
                        <div className="folder-description-override"><label>按分类设置<select value={descriptionOverrideFolderId} onChange={event => setDescriptionOverrideFolderId(event.target.value)}><option value="">选择分类后覆盖全局设置</option>{folderOptions.map(folder => <option key={folder.id} value={folder.id}>{"　".repeat(folder.depth)}{folder.path}</option>)}</select></label>{selectedDescriptionOverrideFolder && <><label className="setting-checkbox"><input type="checkbox" checked={selectedDescriptionOverrideValue ?? showWebsiteDescriptions} onChange={event => setFolderDescriptionOverrides(previous => ({ ...previous, [selectedDescriptionOverrideFolder.id]: event.target.checked }))} /><span><strong>此分类及子分类显示描述</strong><small>{selectedDescriptionOverrideValue === undefined ? "当前跟随全局设置；勾选或取消即创建分类级覆盖。" : "当前已使用分类级覆盖，可恢复为全局设置。"}</small></span></label>{selectedDescriptionOverrideValue !== undefined && <button type="button" className="preference-reset" onClick={() => setFolderDescriptionOverrides(previous => { const next = { ...previous }; delete next[selectedDescriptionOverrideFolder.id]; return next; })}>恢复跟随全局</button>}</>}</div>
                      </article>
                    </div>
                  </section>
                )}

                {settingsTab === "bookmarks" && (
                  <section className="settings-panel" aria-label="书签管理">
                    <div className="settings-panel-copy"><span>HOLDINGS</span><h3>书签与批量处理</h3><p>新建、编辑、删除、移动和排序书签；勾选多条记录即可批量处理。</p></div>
                    <div className="settings-grid bookmark-layout">
                      <article className="settings-card bookmark-form-card">
                        <h4>{editingBookmarkId ? "编辑书签" : "新建书签"}</h4>
                        <label>名称<input value={bookmarkDraft.title} onChange={event => setBookmarkDraft(previous => ({ ...previous, title: event.target.value }))} placeholder="书签名称" /></label>
                        <label>网址<input value={bookmarkDraft.url} onChange={event => setBookmarkDraft(previous => ({ ...previous, url: event.target.value }))} placeholder="https://example.com" /></label>
                        <label>说明（可选）<textarea value={bookmarkDraft.description} onChange={event => setBookmarkDraft(previous => ({ ...previous, description: event.target.value }))} placeholder="仅用于导出与后续维护" /></label>
                        <label>所属分类<select value={bookmarkDraft.parentId} onChange={event => setBookmarkDraft(previous => ({ ...previous, parentId: event.target.value }))}><option value={ROOT_FOLDER_ID}>未分类（顶层）</option>{folderOptions.map(folder => <option key={folder.id} value={folder.id}>{folder.path}</option>)}</select></label>
                        <div className="inline-actions"><button className="settings-primary" type="button" onClick={handleCreateOrUpdateBookmark}>{editingBookmarkId ? <Pencil size={15} /> : <Plus size={15} />}{editingBookmarkId ? "保存修改" : "创建书签"}</button>{editingBookmarkId && <button type="button" onClick={() => { setEditingBookmarkId(null); setBookmarkDraft(emptyBookmarkDraft()); }}>取消编辑</button>}</div>
                      </article>
                      <article className="settings-card bookmark-list-card">
                        <div className="bookmark-list-head"><h4>全部书签 <span>{manageableBookmarks.length}</span></h4><div><button type="button" onClick={() => setSelectedBookmarkIds(new Set(filteredManageableBookmarks.map(item => item.id)))}>全选结果</button><button type="button" onClick={() => setSelectedBookmarkIds(new Set())}>清空选择</button></div></div>
                        <input className="bookmark-manager-search" value={bookmarkManagerQuery} onChange={event => { setBookmarkManagerQuery(event.target.value); setBookmarkManagerLimit(240); }} placeholder="检索名称、网址、说明或分类路径" aria-label="检索待管理书签" />
                        {filteredManageableBookmarks.length > visibleManageableBookmarks.length && <p className="manager-list-note">当前显示 {visibleManageableBookmarks.length} / {filteredManageableBookmarks.length} 条。可检索全部书签，或继续加载更多。</p>}
                        {selectedBookmarkIds.size > 0 && <div className="batch-bar"><strong>已选 {selectedBookmarkIds.size} 条</strong><select value={batchMoveTarget} onChange={event => setBatchMoveTarget(event.target.value)}><option value={ROOT_FOLDER_ID}>移至未分类</option>{folderOptions.map(folder => <option key={folder.id} value={folder.id}>{folder.path}</option>)}</select><button type="button" onClick={handleBatchMove}><Move size={14} />批量移动</button><button className="danger-button" type="button" onClick={handleBatchDelete}><Trash2 size={14} />批量删除</button></div>}
                        <div className="bookmark-manager-list">
                          {visibleManageableBookmarks.map(item => <div className="bookmark-manager-row" key={item.id}>
                            <label className="row-check"><input type="checkbox" checked={selectedBookmarkIds.has(item.id)} onChange={() => toggleSelectedBookmark(item.id)} aria-label={`选择 ${item.title}`} /></label>
                            <BookmarkIcon item={item} source={iconSource} />
                            <div className="manager-bookmark-details"><strong>{item.title}</strong><div className="manager-bookmark-meta"><span className="manager-bookmark-category">{item.path.join(" / ") || "未分类"}</span><a href={item.url} target="_blank" rel="noreferrer" title={item.url}>{item.url}</a></div>{item.description && <p>{item.description}</p>}</div>
                            <div className="row-actions"><button type="button" onClick={() => beginEditBookmark(item.id)} aria-label={`编辑 ${item.title}`}><Pencil size={14} /></button><button type="button" onClick={() => applyManagedTree(reorderBookmarkNode(bookmarks, item.id, -1), "已上移书签")} aria-label={`上移 ${item.title}`}>↑</button><button type="button" onClick={() => applyManagedTree(reorderBookmarkNode(bookmarks, item.id, 1), "已下移书签")} aria-label={`下移 ${item.title}`}>↓</button><button className="danger-icon" type="button" onClick={() => { if (window.confirm(`删除“${item.title}”？`)) applyManagedTree(removeBookmarkNodes(bookmarks, [item.id]), "已删除书签"); }} aria-label={`删除 ${item.title}`}><Trash2 size={14} /></button></div>
                          </div>)}
                        </div>
                        {visibleManageableBookmarks.length < filteredManageableBookmarks.length && <button className="load-more-bookmarks" type="button" onClick={() => setBookmarkManagerLimit(limit => Math.min(limit + 240, filteredManageableBookmarks.length))}>加载更多书签（+{Math.min(240, filteredManageableBookmarks.length - visibleManageableBookmarks.length)}）</button>}
                      </article>
                    </div>
                  </section>
                )}

                {settingsTab === "backup" && (
                  <section className="settings-panel" aria-label="备份与恢复">
              <div className="settings-panel-copy"><span>BACKUP / RESTORE</span><h3>一键备份与恢复</h3><p>本地备份会下载 JSON 文件；受管理云端备份仅对登录用户私有可见。数据工具导出使用本地账号验证。</p></div>
                    <div className="settings-grid backup-grid">
                      <article className="settings-card"><h4>本地备份与导入</h4><div className="stack-actions"><button className="settings-primary" type="button" onClick={() => requestExport("json")}><FileJson2 size={15} />下载本地 JSON 备份</button><button type="button" onClick={() => importRef.current?.click()}><FileUp size={15} />从本地文件恢复</button><button type="button" onClick={() => requestExport("xlsx")}><FileSpreadsheet size={15} />导出 XLSX</button><button type="button" onClick={() => requestExport("csv")}><FileSpreadsheet size={15} />导出 CSV</button><button type="button" onClick={() => void downloadSpreadsheetTemplate("xlsx")}><Download size={15} />下载 XLSX 空白模板</button><button type="button" onClick={() => void downloadSpreadsheetTemplate("csv")}><Download size={15} />下载 CSV 空白模板</button></div></article>
                      <article className="settings-card"><h4>受管理云端备份</h4>{isAuthenticated ? <><div className="inline-actions"><button className="settings-primary" type="button" onClick={syncCurrentBookmarks} disabled={saveCloudBackup.isPending || !archiveReady}><Cloud size={15} />{saveCloudBackup.isPending ? "正在备份…" : "一键云端备份"}</button>{cloudBackups.data?.[0] && <button type="button" onClick={() => restoreCloudBackup(cloudBackups.data![0].id)} disabled={accessCloudBackup.isPending}><RotateCcw size={15} />恢复最新备份</button>}</div><div className="cloud-backup-list" aria-live="polite">{cloudBackups.isLoading ? <p>正在读取云端备份…</p> : cloudBackups.data?.length ? <ul>{cloudBackups.data.map(backup => <li key={backup.id}><div><strong>{backup.fileName}</strong><span>{backup.bookmarkCount} 个入口 · {new Date(backup.createdAt).toLocaleString("zh-CN")}</span></div><button type="button" onClick={() => restoreCloudBackup(backup.id)} disabled={accessCloudBackup.isPending}><RotateCcw size={14} />恢复</button></li>)}</ul> : <p>暂无云端备份。</p>}</div></> : <button className="settings-primary" type="button" onClick={startLogin} disabled={authLoading}><LogIn size={15} />登录以启用云端备份</button>}</article>
                      <article className="settings-card danger-card"><h4>数据维护</h4><p>以下操作会修改当前浏览器中的书签数据，执行前请先创建本地或云端备份。</p><div className="stack-actions"><button type="button" onClick={restoreFactoryDefaults}><RefreshCcw size={15} />恢复出厂默认数据</button><button className="danger-button" type="button" onClick={clearAllBookmarks}><Eraser size={15} />一键清除当前数据</button></div></article>
                    </div>
                  </section>
                )}

                {settingsTab === "external" && (
                  <section className="settings-panel" aria-label="外部备份">
                    <div className="settings-panel-copy"><span>EXTERNAL VAULTS</span><h3>外部备份连接</h3><p>外部备份的密钥通过项目安全密钥面板保存，不会写入浏览器、LocalStorage 或此设置表单。此页只显示是否已配置，并允许登录用户触发服务端备份。</p></div>
                    <div className="settings-grid external-grid">
                      <article className="settings-card external-card"><span className={`connection-status ${externalBackupStatus.data?.nutstore ? "is-connected" : ""}`}>{externalBackupStatus.data?.nutstore ? "已配置" : "待配置"}</span><h4>坚果云 WebDAV</h4><p>将规范化 JSON 写入 `bookmark-navigation/` 专用目录。</p><div className="external-config"><strong>安全参数</strong><code>NUTSTORE_WEBDAV_URL</code><span>WebDAV 根地址</span><code>NUTSTORE_WEBDAV_USERNAME</code><span>坚果云账号</span><code>NUTSTORE_WEBDAV_APP_PASSWORD</code><span>第三方应用密码</span></div><div className="stack-actions">{isAuthenticated ? <button className="settings-primary" type="button" onClick={() => syncExternalBackup("nutstore")} disabled={saveExternalBackup.isPending || !externalBackupStatus.data?.nutstore}><Cloud size={15} />{saveExternalBackup.isPending ? "正在备份…" : "备份到坚果云"}</button> : <button className="settings-primary" type="button" onClick={startLogin}><LogIn size={15} />登录后备份</button>}<button type="button" onClick={() => explainExternalBackup("nutstore")}>查看安全设置方法</button></div></article>
                      <article className="settings-card external-card"><span className={`connection-status ${externalBackupStatus.data?.cloudflareKv ? "is-connected" : ""}`}>{externalBackupStatus.data?.cloudflareKv ? "已配置" : "待配置"}</span><h4>Cloudflare KV</h4><p>保存最新的 JSON 快照，适合恢复最近一次数据。</p><div className="external-config"><strong>安全参数</strong><code>CLOUDFLARE_ACCOUNT_ID</code><span>Cloudflare 账户 ID</span><code>CLOUDFLARE_API_TOKEN</code><span>具备 KV 写入权限的 API Token</span><code>CLOUDFLARE_KV_NAMESPACE_ID</code><span>KV 命名空间 ID</span></div><div className="stack-actions">{isAuthenticated ? <button className="settings-primary" type="button" onClick={() => syncExternalBackup("cloudflare_kv")} disabled={saveExternalBackup.isPending || !externalBackupStatus.data?.cloudflareKv}><Cloud size={15} />备份到 Cloudflare KV</button> : <button className="settings-primary" type="button" onClick={startLogin}><LogIn size={15} />登录后备份</button>}<button type="button" onClick={() => explainExternalBackup("cloudflare")}>查看安全设置方法</button></div></article>
                      <article className="settings-card external-card"><span className={`connection-status ${externalBackupStatus.data?.cloudflareD1 ? "is-connected" : ""}`}>{externalBackupStatus.data?.cloudflareD1 ? "已配置" : "待配置"}</span><h4>Cloudflare D1</h4><p>经受认证的 Worker 代理写入备份历史元数据，不会向浏览器暴露 SQL。</p><div className="external-config"><strong>安全参数</strong><code>CLOUDFLARE_D1_PROXY_URL</code><span>受认证 Worker 代理地址</span><code>CLOUDFLARE_D1_PROXY_TOKEN</code><span>Worker 代理令牌</span></div><div className="stack-actions">{isAuthenticated ? <button className="settings-primary" type="button" onClick={() => syncExternalBackup("cloudflare_d1")} disabled={saveExternalBackup.isPending || !externalBackupStatus.data?.cloudflareD1}><Cloud size={15} />写入 Cloudflare D1</button> : <button className="settings-primary" type="button" onClick={startLogin}><LogIn size={15} />登录后备份</button>}<button type="button" onClick={() => explainExternalBackup("cloudflare")}>查看安全设置方法</button></div></article>
                    </div>
                    <p className="settings-hint">配置入口：按项目根目录 <code>EXTERNAL_BACKUP_ENVIRONMENT.md</code> 中的变量模板，在项目管理面板的安全环境变量区域填写对应值。密钥字段会以遮罩形式管理，当前页面不显示、保存或回传任何密钥值。仅配置了所需变量的备份按钮才会启用。</p>
                  </section>
                )}
              </div>
            </section>
          </DialogContent>
        </Dialog>

        <section className="search-stage">
          <div className="search-stage-overlay" />
          <div className="search-stage-content">
            <div className="heading-copy">
              <p className="eyebrow">个人导航台</p>
              <h1>从这里，回到<br /><em>每一个常用入口。</em></h1>
            </div>
            <div className="search-workbench">
              <div className="search-box">
                <Search size={20} />
                <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === "Enter" && runExternalSearch()} placeholder="站内查找，或输入关键词检索全网" aria-label="搜索书签或全网" />
                {query && <span className="match-marker">站内 {matchedItems.length}</span>}
              </div>
              <div className="search-tools">
                <select value={engine} onChange={event => setEngine(event.target.value)} aria-label="选择外部搜索引擎">
                  {(["国内", "全球", "海外"] as const).map(region => (
                    <optgroup key={region} label={region}>
                      {searchEngines.filter(item => item.region === region).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <button type="button" onClick={runExternalSearch}>全网检索 <ExternalLink size={15} /></button>
              </div>
            </div>
            <div className="search-stage-footer">
              <span><Command size={14} /> 输入即可筛选</span>
              <span>按 Enter 使用 {searchEngines.find(item => item.id === engine)?.label} 检索</span>
            </div>
          </div>
        </section>

        <section className="content-toolbar">
          <div>
            <span className="eyebrow">书签目录</span>
            <p>{isFiltering ? `“${query}” 的匹配结果` : "全部分类"}</p>
          </div>
          <label className="icon-source-select">
            <span>图标来源</span>
            <select value={iconSource} onChange={event => setIconSource(event.target.value as IconSource)}>
              {iconSources.map(source => <option key={source.value} value={source.value}>{source.label} · {source.detail}</option>)}
            </select>
          </label>
        </section>

        <div className={`bookmark-collection card-density-${cardDensity} description-lines-${descriptionLineLimit} ${categoryTransitionTarget === "all" ? "is-category-transitioning" : ""}`} id="bookmark-collection">
          {activeFolders.map(folder => <FolderSection key={folder.id} folder={folder} iconSource={iconSource} inheritedShowDescription={showWebsiteDescriptions} descriptionOverrides={folderDescriptionOverrides} transitionTargetId={categoryTransitionTarget} query={query} />)}
          {!activeFolders.length || (isFiltering && !matchedItems.length) ? (
            <section className="empty-archive">
              <div>
                <span className="eyebrow">未找到记录</span>
                <h2>这个索引暂时没有匹配项。</h2>
                <p>试试更短的关键词，或者直接用上方的全网检索继续寻找。</p>
              </div>
              <div className="empty-index-mark" aria-hidden="true"><span>NO</span><span>RECORD</span></div>
            </section>
          ) : null}
        </div>

        <footer className="archive-footer">
          <p>ARCHIVE INDEX · 本地书签工作台</p>
          <p><CircleHelp size={14} /> 图标服务可能受网络与站点策略影响，系统会自动尝试备用来源。</p>
        </footer>
      </main>

      <input ref={importRef} className="sr-only" type="file" accept=".json,.html,.htm,.xlsx,.csv,application/json,text/html,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importBookmarks} />
      {pendingImport && (
        <div className="import-overlay" role="dialog" aria-modal="true" aria-labelledby="import-choice-title">
          <section className="import-choice">
            <span className="eyebrow">导入已解析</span>
            <h2 id="import-choice-title">解析完成，请确认导入内容。</h2>
            <p>文件：<strong>{pendingImport.fileName}</strong>。导入结果会保留原始分类层级和出现顺序；确认写入前，请先检查下方数据摘要和样本。</p>
            <div className="import-preview-stats" aria-label="导入数据摘要"><span><strong>{pendingImport.preview.bookmarkCount}</strong>个书签</span><span><strong>{pendingImport.preview.folderCount}</strong>个分类</span><span><strong>{pendingImport.preview.maxDepth}</strong>级目录</span></div>
            <ul className="import-preview-samples" aria-label="导入书签样本">{pendingImport.preview.samples.map(item => <li key={item.id}><BookmarkIcon item={item} source={iconSource} /><div><strong>{item.title}</strong><span>{item.path.join(" / ") || "未分类"}</span><small>{item.url}</small></div></li>)}</ul>
            <div className="import-choice-actions">
              <button className="import-replace" type="button" onClick={() => applyImport("replace")}><strong>覆盖导入</strong><span>清空当前数据，完整使用本次书签。</span></button>
              <button className="import-merge" type="button" onClick={() => applyImport("merge")}><strong>增量导入</strong><span>合并同名分类，按 URL 去重，新增内容保留原始顺序。</span></button>
            </div>
            <button className="import-cancel" type="button" onClick={() => setPendingImport(null)}>取消本次导入</button>
          </section>
        </div>
      )}
      <button className={`back-to-top ${showTop ? "is-visible" : ""}`} type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="返回顶部"><ArrowUp size={19} /></button>
    </div>
  );
}

function flattenFolders(nodes: BookmarkNode[]): string[] {
  return nodes.flatMap(node => isFolder(node) ? [node.id, ...flattenFolders(node.children)] : []);
}

function countFolders(nodes: BookmarkNode[]): number {
  return nodes.reduce((total, node) => total + (isFolder(node) ? 1 + countFolders(node.children) : 0), 0);
}
