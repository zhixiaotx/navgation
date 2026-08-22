import assert from "node:assert/strict";
import { countBookmarks, isFolder, mergeBookmarkNodes, parseBrowserBookmarkHtml } from "../client/src/lib/bookmarks.ts";
import { createStandaloneNavigation } from "../client/src/lib/standalone.ts";

const browserExport = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>工作</H3>
  <DL><p>
    <DT><A HREF="https://alpha.example/">Alpha</A>
    <DT><H3>设计</H3>
    <DL><p>
      <DT><A HREF="https://beta.example/">Beta</A>
    </DL><p>
    <DT><A HREF="https://gamma.example/">Gamma</A>
  </DL><p>
  <DT><H3>阅读</H3>
  <DL><p>
    <DT><A HREF="https://delta.example/">Delta</A>
  </DL><p>
</DL><p>`;

const parsed = parseBrowserBookmarkHtml(browserExport);
assert.equal(parsed.length, 2, "应保留两个顶级分类");
assert.ok(isFolder(parsed[0]) && parsed[0].title === "工作", "第一个顶级分类应保持原始顺序");
assert.ok(isFolder(parsed[1]) && parsed[1].title === "阅读", "第二个顶级分类应保持原始顺序");
assert.ok(isFolder(parsed[0]), "工作应为分类");
assert.equal(parsed[0].children[0].title, "Alpha", "分类内书签应保持原始顺序");
assert.ok(isFolder(parsed[0].children[1]) && parsed[0].children[1].title === "设计", "应重建二级分类");
assert.equal(parsed[0].children[2].title, "Gamma", "二级分类后的同级书签应保持原始顺序");
assert.equal(countBookmarks(parsed), 4, "应解析全部链接");

const merged = mergeBookmarkNodes(parsed, parseBrowserBookmarkHtml(`
  <DL><p>
    <DT><H3>工作</H3><DL><p><DT><A HREF="https://alpha.example/">Alpha duplicate</A><DT><A HREF="https://epsilon.example/">Epsilon</A></DL><p>
    <DT><H3>新分类</H3><DL><p><DT><A HREF="https://zeta.example/">Zeta</A></DL><p>
  </DL><p>`));
assert.equal(merged.length, 3, "增量导入应追加未存在的顶级分类");
assert.ok(isFolder(merged[0]), "合并后的工作分类应仍存在");
assert.equal(countBookmarks(merged[0].children), 4, "重复 URL 不应重复写入，新增链接应追加到原分类末尾");
assert.equal(countBookmarks(merged), 6, "增量合并应保留旧数据并追加全部新链接");

const standalone = createStandaloneNavigation(parsed, "google");
assert.match(standalone, /覆盖导入/, "离线单页导航应提供覆盖导入");
assert.match(standalone, /增量导入/, "离线单页导航应提供增量导入");
assert.match(standalone, /全部收起/, "离线单页导航应提供分类折叠控制");
assert.match(standalone, /Google Scholar/, "离线单页导航应同步包含 20 个搜索引擎配置");

console.log("书签层级解析与增量合并验证通过。");
