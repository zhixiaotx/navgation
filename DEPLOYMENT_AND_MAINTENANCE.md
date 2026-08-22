# 部署与维护

本文件承接根目录 [`README.md`](README.md) 的部署和维护说明。

## 1. 响应式使用方式

| 视口 | 主要体验 |
| --- | --- |
| 1280px 及以上 | 固定左侧分类脊柱、自动多列书签卡片、完整工具栏和宽设置面板 |
| 841px–1180px | 保留侧栏和多列网格，压缩内容区留白 |
| 611px–840px | 顶部品牌区、横向分类索引和可展开完整目录入口 |
| 610px 及以下 | 单列卡片、放大触控目标、全屏设置管理与竖向验证操作 |

右下角向上箭头会在滚动后出现；主题偏好保存在浏览器中。长目录使用 `content-visibility` 降低离屏渲染成本。

## 2. 静态发布

项目使用相对资源路径和 `base: "./"`，因此静态前端可部署在根域名或仓库子路径。静态平台只发布 `dist/public/`，具备默认数据、搜索、本地导入导出和主题；它们不运行 Express/tRPC，因此不支持登录、云端备份或外部备份。

| 平台 | 构建命令 | 发布目录 |
| --- | --- | --- |
| GitHub Pages | 工作流执行 `npm run check && npm run build` | `gh-page` 分支根目录 |
| Cloudflare Pages | `npm run build` | `dist/public` |
| Vercel 静态输出 | `npm run build` | `dist/public` |
| Netlify | `npm run build` | `dist/public` |

### GitHub Pages

`.github/workflows/deploy-gh-page.yml` 会在 `main` 推送或手动触发时构建，并将 `dist/public/` 推送到 `gh-page`。在 GitHub 仓库中依次设置：

1. **Settings → Actions → General**：启用 **Read and write permissions**。
2. 等待 **Build and publish gh-page** 工作流成功。
3. **Settings → Pages**：选择 **Deploy from a branch**，分支选 `gh-page`，目录选 `/(root)`。

工作流通过 `actions/setup-node@v4` 使用 **npm 缓存** 和根目录的 `package-lock.json`，随后执行 `npm ci`、类型检查与静态构建。根目录 `.npmrc` 中的 `legacy-peer-deps=true` 用于兼容当前 Vite 插件的历史 peer dependency 声明；GitHub Pages 的安装、缓存与构建均由 npm 执行。

### Cloudflare Pages、Vercel 与 Netlify

Cloudflare Pages：构建命令 `npm run build`，输出目录 `dist/public`，Node.js 22。也可运行：

```bash
npm run build
npx wrangler pages deploy dist/public --project-name bookmark-navigation
```

Vercel 与 Netlify 使用相同的构建命令、输出目录和 Node 版本；项目中的 `vercel.json`、`netlify.toml`、`wrangler.toml` 已保存对应静态配置。[2] [3] [4]

## 3. 全栈部署边界

若需登录、云端备份、恢复或外部备份，必须运行 Node 服务端、MySQL、OAuth 和受管理对象存储。部署前先设置平台提供的系统变量及所需外部备份安全变量；不要提交真实 `.env`。数据库结构变更顺序是：修改 `drizzle/schema.ts` → `npm run db:push` → 审阅生成的 SQL → 执行迁移。

## 4. 验证与维护命令

| 命令 | 用途 |
| --- | --- |
| `npm run check` | TypeScript 类型检查 |
| `npm test` | 运行书签管理、表格、云端和外部备份测试 |
| `npm run build` | 构建前端静态产物与 Node 服务端 |
| `npx tsx scripts/bookmark-import-smoke.mjs` | 验证 HTML 书签解析和递归增量合并 |
| `npx tsx scripts/standalone-export-smoke.mjs` | 验证离线单页导航导出 |
| `npm run dev` / `npm run start` | 启动开发服务 / 已构建的全栈服务 |

推荐顺序：先在网页中验证操作，再运行 `npm run check`、`npm test`、`npm run build`；确认默认目录不含隐私链接后再提交代码。

## 5. 常见问题

| 问题 | 处理方式 |
| --- | --- |
| 网站仍显示旧书签 | 删除 LocalStorage 中的 `archive-index-bookmarks` 与 `archive-index-default-version` 后刷新 |
| 修改默认 JSON 后没有变化 | 确认编辑 `client/public/data/default-bookmarks.json` 并重新构建 |
| 导入后左侧没有分类 | 检查 JSON 是否包含 `children`，或确认 HTML 为浏览器标准书签导出 |
| 云端备份无法恢复 | 使用保存时相同的登录账号；恢复前先导出本地 JSON |
| 导出未开始或提示未授权 | 确认已登录；登录后让会话完成加载，再重新点击导出。离线单页导航不支持服务器会话授权 |
| GitHub Pages 404 | 确认工作流成功且 Pages 来源为 `gh-page / (root)` |
| GitHub Pages 显示应用内 404 页面 | 更新到当前版本后重新运行工作流；前端会自动将仓库子路径识别为应用根路径 |
| 图标不显示 | 切换图标来源；第三方服务可能受网络或站点策略限制 |
| 外部备份待配置 | 阅读根目录 `EXTERNAL_BACKUP_ENVIRONMENT.md`，在安全变量中设置对应值后重启服务 |

## References

[1] [GitHub Docs：Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

[2] [Cloudflare Pages Docs：Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

[3] [Vercel Docs：Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[4] [Netlify Docs：Vite framework guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
