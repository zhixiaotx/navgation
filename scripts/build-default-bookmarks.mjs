import { readFileSync, writeFileSync } from "node:fs";

const jgtab = JSON.parse(readFileSync("/home/ubuntu/upload/jgtab.json", "utf8"));
const webdesk = JSON.parse(readFileSync("/home/ubuntu/upload/webdesk.json", "utf8"));

const cleanText = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim() : fallback);

const jgtabCategories = (jgtab.categories ?? []).map((category, index) => ({
  id: `jgtab-folder-${index + 1}`,
  type: "folder",
  title: cleanText(category, "未命名分类"),
  children: (jgtab.sites ?? [])
    .filter((site) => site.category === category && /^https?:\/\//i.test(site.url ?? ""))
    .map((site) => ({
      id: `jgtab-site-${site.id}`,
      type: "bookmark",
      title: cleanText(site.name, "未命名书签"),
      url: site.url,
      description: cleanText(site.description, ""),
    })),
}));

function convertWebDeskNode(node, path = "root") {
  const title = cleanText(node.name, "未命名分类");
  if (Array.isArray(node.children)) {
    return {
      id: `webdesk-folder-${path}-${node.id ?? title}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
      type: "folder",
      title,
      children: node.children.map((child, index) => convertWebDeskNode(child, `${path}-${index + 1}`)),
    };
  }

  return {
    id: `webdesk-site-${path}-${node.linkId ?? title}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
    type: "bookmark",
    title,
    url: node.url,
    description: cleanText(node.description, ""),
  };
}

const webdeskCategories = (webdesk.categoryTree ?? [])
  .map((node, index) => convertWebDeskNode(node, `root-${index + 1}`))
  .filter((node) => node.type === "folder");

const merged = [
  {
    id: "source-jgtab",
    type: "folder",
    title: "极光Tab 导航",
    children: jgtabCategories,
  },
  {
    id: "source-webdesk",
    type: "folder",
    title: "WebDesk 导航",
    children: webdeskCategories,
  },
];

writeFileSync(
  "/home/ubuntu/webdev-static-assets/default-bookmarks-v20260822.json",
  JSON.stringify({ version: "2026-08-22", bookmarks: merged }, null, 2),
);

function count(nodes) {
  return nodes.reduce((total, node) => total + (node.type === "folder" ? count(node.children) : 1), 0);
}

console.log(JSON.stringify({ sources: 2, bookmarks: count(merged), topLevelFolders: merged.length, jgtabCategories: jgtabCategories.length, webdeskCategories: webdeskCategories.length }));
