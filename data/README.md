# 默认书签数据

`default-bookmarks.json` 是网站首次打开时读取的默认目录。`Home.tsx` 通过相对路径 `./data/default-bookmarks.json` 加载它，因此在根域名与 GitHub Pages 子目录中都能正常访问。

文件根部包含一个便于人工识别的 `version` 字符串和一个 `bookmarks` 数组。每一个节点应具有唯一 `id` 与 `title`。`folder` 节点包含 `children`，可以递归嵌套；`bookmark` 节点包含以 `http://` 或 `https://` 开头的 `url`。

```json
{
  "version": "2026-08-22",
  "bookmarks": [
    {
      "id": "folder-tools",
      "type": "folder",
      "title": "常用工具",
      "children": [
        {
          "id": "bookmark-example",
          "type": "bookmark",
          "title": "示例网站",
          "url": "https://example.com/",
          "description": "可选说明",
          "iconSource": "favicon_im"
        }
      ]
    }
  ]
}
```

可选图标字段包括 `iconSource`、`customIcon` 和 `iconifyIcon`。正常网址不需要手动填写图标，系统会采用当前页面选择的图标来源。`iconSource: "custom"` 时填写 `customIcon` 图片 URL；`iconSource: "iconify"` 时填写 `iconifyIcon`，例如 `logos:github-icon`。

修改此文件后重新执行 `pnpm check && pnpm build` 即可将新目录打包到网站中。建议先在网站内导入并整理数据、通过导出 JSON 保留备份，再覆盖此文件。请注意：已经拥有 `archive-index-bookmarks` LocalStorage 数据的访问者不会被默认目录覆盖；如需让浏览器重新读取默认数据，请删除该键及 `archive-index-default-version` 后刷新。

这份文件是**公开的默认目录**，会随着静态网页发布。登录用户的个人 JSON 备份则存入受管理对象存储，使用 `bookmark-backups/<用户 ID>/` 键前缀，不会写回这个项目文件夹。
