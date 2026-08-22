import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createStandaloneNavigation } from "../client/src/lib/standalone.ts";

const bookmarks = [
  {
    id: "root-a",
    type: "folder",
    title: "一级分类",
    children: [
      { id: "link-a", type: "bookmark", title: "入口 A", url: "https://example.com" },
      {
        id: "child-b",
        type: "folder",
        title: "二级分类",
        children: [{ id: "link-b", type: "bookmark", title: "入口 B", url: "https://example.org" }],
      },
    ],
  },
];

const html = createStandaloneNavigation(bookmarks, "favicon_im");
writeFileSync("/tmp/bookmark-navigation-standalone.html", html);
for (const marker of [
  'class="shell"',
  'id="collection"',
  'class="console"',
  "export-page",
  "theme-toggle",
  "import-trigger",
  "export-xlsx",
  "export-csv",
  "分类路径",
  "var sources",
  "function section",
  "scrollIntoView",
]) {
  assert.ok(html.includes(marker), `missing ${marker}`);
}

const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .find(content => content.includes("var seed=JSON.parse"));
assert.ok(script, "embedded standalone script was not found");
new Function(script);

const xlsxBundle = readFileSync(new URL("../node_modules/xlsx/dist/xlsx.full.min.js", import.meta.url), "utf8");
const spreadsheetHtml = createStandaloneNavigation(bookmarks, "favicon_im", xlsxBundle);
assert.ok(spreadsheetHtml.includes(xlsxBundle.slice(0, 80)), "XLSX engine was not embedded in offline export");
new Function(xlsxBundle);
console.log("standalone export smoke passed");
