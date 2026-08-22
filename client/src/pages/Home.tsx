/**
 * 档案索引室设计：固定分类索引脊 + 资料卡式书签，以档案蓝强调检索、定位和打开。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  Command,
  Download,
  ExternalLink,
  FileArchive,
  FileJson2,
  FileSpreadsheet,
  FileUp,
  FolderClosed,
  FolderOpen,
  LogIn,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Sun,
} from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  archiveForExport,
  BookmarkFolder,
  BookmarkItem,
  BookmarkNode,
  countBookmarks,
  createBookmarkSpreadsheetBlob,
  fallbackIconSources,
  flattenBookmarks,
  getFaviconUrl,
  getHostname,
  IconSource,
  iconSources,
  isFolder,
  mergeBookmarkNodes,
  normalizeArchive,
  parseBrowserBookmarkHtml,
  parseBookmarkSpreadsheetFile,
  sampleBookmarks,
  toBrowserBookmarkHtml,
} from "@/lib/bookmarks";
import { createStandaloneNavigation } from "@/lib/standalone";

const LOGO_URL = "/manus-storage/archive-index-logo_491f7249.png";
const DEFAULT_BOOKMARKS_URL = "./data/default-bookmarks.json";
const DEFAULT_DATA_VERSION = "2026-08-22";
const EXPORT_USERNAME = "admin";
const EXPORT_PASSWORD = "123456";

type ExportKind = "json" | "html" | "xlsx" | "csv" | "standalone";
type PendingImport = {
  nodes: BookmarkNode[];
  fileName: string;
  source: "json" | "html" | "spreadsheet";
};

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

function BookmarkCard({ item, iconSource }: { item: BookmarkItem; iconSource: IconSource }) {
  return (
    <a className="bookmark-card" href={item.url} target="_blank" rel="noreferrer">
      <BookmarkIcon item={item} source={iconSource} />
      <span className="bookmark-body">
        <span className="bookmark-title">{item.title}</span>
      </span>
    </a>
  );
}

function FolderSection({
  folder,
  iconSource,
  query,
  level = 0,
  ancestry = [],
}: {
  folder: BookmarkFolder;
  iconSource: IconSource;
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

  if (!subtreeCount) return null;
  return (
    <section className={`bookmark-section ${level > 0 ? "is-nested" : ""}`} id={`section-${folder.id}`}>
      <header className="section-heading">
        <span className="section-tab" />
        <h2>{folder.title}</h2>
      </header>
      {visible.length > 0 && (
        <div className="bookmark-grid">
          {visible.map(item => <BookmarkCard key={item.id} item={item} iconSource={iconSource} />)}
        </div>
      )}
      {childFolders.length > 0 && (
        <div className="nested-bookmark-sections">
          {childFolders.map(child => <FolderSection key={child.id} folder={child} iconSource={iconSource} query={query} level={level + 1} ancestry={folderPath} />)}
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
  const [showTop, setShowTop] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [pendingExport, setPendingExport] = useState<ExportKind | null>(null);
  const [exportUsername, setExportUsername] = useState("");
  const [exportPassword, setExportPassword] = useState("");
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
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

  const topFolders = useMemo(() => {
    const rootBookmarks = bookmarks.filter(node => !isFolder(node));
    const folders = bookmarks.filter(isFolder);
    return rootBookmarks.length ? [{ id: "root-ungrouped", type: "folder" as const, title: "未分类书签", children: rootBookmarks }, ...folders] : folders;
  }, [bookmarks]);
  const totalBookmarks = useMemo(() => countBookmarks(bookmarks), [bookmarks]);
  const allItems = useMemo(() => flattenBookmarks(bookmarks), [bookmarks]);
  const isFiltering = query.trim().length > 0;
  const activeFolders = topFolders;
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

      try {
        const raw = localStorage.getItem("archive-index-bookmarks");
        saved = raw ? normalizeArchive(JSON.parse(raw)) : null;
        storedVersion = localStorage.getItem("archive-index-default-version");
      } catch {
        saved = null;
      }

      const isLegacySample = Boolean(saved && countBookmarks(saved) === countBookmarks(sampleBookmarks));
      const shouldApplyDefault = !saved || saved.length === 0 || (!storedVersion && isLegacySample);

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
    const onScroll = () => setShowTop(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
        ? normalizeArchive(JSON.parse(await file.text()))
        : isSpreadsheet
          ? await parseBookmarkSpreadsheetFile(file)
          : parseBrowserBookmarkHtml(await file.text());
      setPendingImport({ nodes: next, fileName: file.name, source: isJson ? "json" : isSpreadsheet ? "spreadsheet" : "html" });
    } catch (error) {
      toast.error("导入未完成", { description: error instanceof Error ? error.message : "无法读取该文件。" });
    } finally {
      event.target.value = "";
    }
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

  async function exportStandalone() {
    try {
      const { default: xlsxBundle } = await import("xlsx/dist/xlsx.full.min.js?raw");
      downloadFile("bookmark-navigation.html", createStandaloneNavigation(bookmarks, iconSource, xlsxBundle), "text/html;charset=utf-8");
      toast.success("已导出单页导航", { description: "该 HTML 文件可本地双击打开，并保留搜索、分类、主题及 XLSX、CSV 数据工具。" });
    } catch (error) {
      toast.error("单页导航导出未完成", { description: error instanceof Error ? error.message : "无法嵌入表格工具。" });
    }
  }

  function requestExport(kind: ExportKind) {
    setExportUsername("");
    setExportPassword("");
    setPendingExport(kind);
  }

  function verifyAndExport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (exportUsername !== EXPORT_USERNAME || exportPassword !== EXPORT_PASSWORD) {
      toast.error("账号或密码不正确", { description: "请使用管理员账号后再次导出。" });
      return;
    }

    const selectedExport = pendingExport;
    setPendingExport(null);
    setExportPassword("");
    if (selectedExport === "json") exportJson();
    if (selectedExport === "html") exportHtml();
    if (selectedExport === "xlsx") void exportSpreadsheet("xlsx");
    if (selectedExport === "csv") void exportSpreadsheet("csv");
    if (selectedExport === "standalone") void exportStandalone();
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
            <button className="tool-trigger" type="button" onClick={() => setShowTools(value => !value)} aria-expanded={showTools}>
              <FileArchive size={16} />
              <span>数据工具</span>
              <ChevronDown size={14} className={showTools ? "rotate-180" : ""} />
            </button>
            <button className="theme-switch" type="button" onClick={toggleTheme} aria-label="切换日夜模式">
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              <span>{theme === "light" ? "夜阅" : "日阅"}</span>
            </button>
          </div>
        </header>

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

        {showTools && (
          <section className="data-console" aria-label="数据导入导出">
            <div className="data-console-copy">
              <span>ARCHIVE CONTROL</span>
              <h2>导入、整理，再带着它走。</h2>
              <p>可读取 Chrome、Edge、Firefox 等浏览器导出的 HTML 书签，也可导入本页导出的 JSON、XLSX 或 CSV。表格中的“分类路径”会自动还原为多级目录。登录后，导入结果会保存为你的私有 JSON 云端备份。</p>
            </div>
            <div className="intake-stamp" aria-hidden="true"><span>IN</span><i>01</i><small>ARCHIVE</small></div>
            <div className="data-console-actions">
              <button className="primary-tool" type="button" onClick={() => importRef.current?.click()}><FileUp size={17} />导入 JSON / HTML / XLSX / CSV</button>
              <button type="button" onClick={() => requestExport("json")}><FileJson2 size={17} />导出 JSON</button>
              <button type="button" onClick={() => requestExport("html")}><Download size={17} />导出书签 HTML</button>
              <button type="button" onClick={() => requestExport("xlsx")}><FileSpreadsheet size={17} />导出 XLSX</button>
              <button type="button" onClick={() => requestExport("csv")}><FileSpreadsheet size={17} />导出 CSV</button>
              <button type="button" onClick={() => requestExport("standalone")}><Archive size={17} />导出单页导航</button>
            </div>
            <section className="cloud-backup-panel" aria-label="云端书签备份">
              <div className="cloud-backup-copy">
                <span><Cloud size={16} /> 云端备份</span>
                <p>{isAuthenticated ? `已登录为 ${user?.name || "当前用户"}。导入的书签数据会自动规范化并保存；也可同步本浏览器当前数据。` : "登录后可将导入的书签数据和当前浏览器书签保存为私有云端备份。"}</p>
              </div>
              {isAuthenticated ? (
                <div className="cloud-backup-controls">
                  <button type="button" className="cloud-sync-button" onClick={syncCurrentBookmarks} disabled={saveCloudBackup.isPending || !archiveReady}>
                    <Cloud size={16} />{saveCloudBackup.isPending ? "正在同步…" : "同步当前数据"}
                  </button>
                  <div className="cloud-backup-list" aria-live="polite">
                    {cloudBackups.isLoading ? <p>正在读取云端备份…</p> : cloudBackups.data?.length ? (
                      <ul>
                        {cloudBackups.data.map(backup => (
                          <li key={backup.id}>
                            <div><strong>{backup.fileName}</strong><span>{backup.bookmarkCount} 个入口 · {new Date(backup.createdAt).toLocaleString("zh-CN")}</span></div>
                            <button type="button" onClick={() => restoreCloudBackup(backup.id)} disabled={accessCloudBackup.isPending}><RotateCcw size={14} />恢复</button>
                          </li>
                        ))}
                      </ul>
                    ) : <p>暂无云端备份。同步或导入 JSON 后会显示在这里。</p>}
                  </div>
                </div>
              ) : (
                <button type="button" className="cloud-login-button" onClick={startLogin} disabled={authLoading}><LogIn size={16} />{authLoading ? "正在检查登录状态…" : "登录以启用云端备份"}</button>
              )}
            </section>
          </section>
        )}

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

        <div className="bookmark-collection" id="bookmark-collection">
          {activeFolders.map(folder => <FolderSection key={folder.id} folder={folder} iconSource={iconSource} query={query} />)}
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
            <h2 id="import-choice-title">检测到 {countBookmarks(pendingImport.nodes)} 个书签，{countFolders(pendingImport.nodes)} 个分类。</h2>
            <p>导入结果会严格保留浏览器书签原有的分类层级和出现顺序。请选择本次数据如何写入资料馆。</p>
            <div className="import-choice-actions">
              <button className="import-replace" type="button" onClick={() => applyImport("replace")}><strong>覆盖导入</strong><span>清空当前数据，完整使用本次书签。</span></button>
              <button className="import-merge" type="button" onClick={() => applyImport("merge")}><strong>增量导入</strong><span>合并同名分类，按 URL 去重，新增内容保留原始顺序。</span></button>
            </div>
            <button className="import-cancel" type="button" onClick={() => setPendingImport(null)}>取消本次导入</button>
          </section>
        </div>
      )}
      {pendingExport && (
        <div className="import-overlay" role="dialog" aria-modal="true" aria-labelledby="export-auth-title">
          <form className="import-choice export-auth" onSubmit={verifyAndExport}>
            <span className="eyebrow">EXPORT AUTHORIZATION</span>
            <h2 id="export-auth-title">验证后导出{pendingExport === "json" ? " JSON 数据" : pendingExport === "html" ? "书签 HTML" : pendingExport === "xlsx" ? " XLSX 数据" : pendingExport === "csv" ? " CSV 数据" : "单页导航"}</h2>
            <p>导出操作需要管理员验证。此验证仅在当前浏览器中进行，不会上传账号或密码。</p>
            <div className="export-credential-fields">
              <label>账号<input value={exportUsername} onChange={event => setExportUsername(event.target.value)} autoComplete="username" placeholder="请输入账号" required /></label>
              <label>密码<input value={exportPassword} onChange={event => setExportPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="请输入密码" required /></label>
            </div>
            <div className="export-auth-actions">
              <button className="confirm-export" type="submit">验证并导出</button>
              <button className="import-cancel" type="button" onClick={() => setPendingExport(null)}>取消</button>
            </div>
          </form>
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
