import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
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
  "var sources",
  "function section",
  "scrollIntoView",
]) {
  assert.ok(html.includes(marker), `missing ${marker}`);
}

const script = html.match(/<script>\n([\s\S]*?)\n<\/script><\/body>/)?.[1];
assert.ok(script, "embedded standalone script was not found");
new Function(script);
console.log("standalone export smoke passed");
