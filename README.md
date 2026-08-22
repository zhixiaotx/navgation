# 书签导航：多级书签、离线导出与云端备份

**书签导航**将浏览器书签转换为可搜索、可折叠、可导入导出的单页导航。项目保留原始书签目录层级，并在保留静态发布能力的同时，提供登录后的 JSON 云端备份、列表和恢复能力。

项目采用 **React 19、Vite、TypeScript、Tailwind CSS、Express、tRPC、MySQL 与受管理对象存储**。未登录时也可以完整浏览默认目录、搜索、导入和导出；登录仅用于个人云端备份，不会改变本地书签的正常使用方式。

> **重要安全说明。** 导出操作使用 `admin / 123456` 作为浏览器端便利校验，用于降低误操作概率。它不是安全认证，因为代码和凭据会随前端发布。不要以此保护私密书签、真实账号或敏感资料。云端备份使用登录用户身份区分数据，但默认目录仍是会随静态页面公开发布的文件。

## 1. 功能总览

| 功能 | 当前实现 | 主要文件 |
| --- | --- | --- |
| 合并默认数据 | 内置极光Tab与 WebDesk 合并书签，共 3,710 个入口；首次访问通过相对路径加载 | `client/public/data/default-bookmarks.json` |
| 多级分类 | 左侧递归树支持任意位置点击展开/收起、全部展开/收起；点击分类仅跳转右侧标题 | `client/src/pages/Home.tsx` |
| 右侧目录 | 递归显示所有层级分类与网址卡片；左侧选择不会过滤其他分类 | `Home.tsx`、`index.css` |
| 网址卡片 | 仅展示图标和名称；无图标底板、无网址元信息；卡片网格自适应宽度 | `Home.tsx`、`index.css` |
| 图标服务 | 默认 `favicon.im`；国内服务优先；失败时自动回退；支持文字、Iconify、自定义图标 | `client/src/lib/bookmarks.ts` |
| 搜索 | 站内即时筛选，并支持 20 个国内外站外搜索引擎，默认必应 | `Home.tsx` |
| 导入 | 支持 JSON、标准浏览器 HTML、XLSX 与 CSV；表格可按分类路径还原多级目录 | `bookmarks.ts` |
| 导入策略 | 覆盖导入或递归增量合并；同名分类合并、URL 去重、保持原有顺序 | `mergeBookmarkNodes` |
| 导出 | JSON、浏览器书签 HTML、XLSX、CSV、离线单页导航；均要求 `admin / 123456` | `Home.tsx`、`standalone.ts` |
| 主题与辅助 | 日夜模式、右下角一键置顶、键盘 Enter 站外搜索 | `ThemeContext.tsx`、`Home.tsx` |
| 响应式体验 | 桌面侧栏、平板多列、手机横向索引与完整目录入口、单列触控卡片 | `client/src/index.css` |
| 云端备份 | 登录后自动备份导入的 JSON，或将当前 LocalStorage 一键同步、恢复 | `server/routers.ts`、`server/storage.ts` |

## 2. 数据到底保存在哪里

项目有三种数据位置，它们的用途不同，不能混为一谈。

| 数据类别 | 实际位置 | 是否公开 | 何时写入或读取 |
| --- | --- | --- |
| 默认书签目录 | `client/public/data/default-bookmarks.json` | **公开**，会随静态站点发布 | 新访问者首次打开时由 `./data/default-bookmarks.json` 读取 |
| 当前浏览器书签 | LocalStorage：`archive-index-bookmarks` | 仅当前浏览器可见 | 导入、恢复、编辑后立即写入；优先于默认目录 |
| 默认数据版本记录 | LocalStorage：`archive-index-default-version` | 仅当前浏览器可见 | 控制旧示例数据迁移与默认目录初始化 |
| 用户 JSON 备份文件 | 受管理对象存储：`bookmark-backups/<用户 ID>/…` | 通过所属用户的后端接口访问 | 登录后导入 JSON 自动保存，或手动同步当前数据 |
| 备份元数据 | MySQL：`bookmark_backups` 表 | 非公开 | 记录用户、对象键、文件名、大小、书签数量、来源与时间 |

> **为什么不把导入 JSON 写进服务器目录？** 自动伸缩或无状态部署环境中的本地磁盘可能被重启、扩容或重新部署清空。项目因此使用持久对象存储保存 JSON 正文，而数据库仅保存可查询和授权的元数据；这是更适合线上部署的文件存储方式。

## 3. 最快上手

请安装 **Node.js 22** 与 `pnpm`。如系统未启用 Corepack，可先执行 `corepack enable`。进入项目根目录后运行：

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` 会启动 Vite 前端和 Express/tRPC 服务端，终端通常显示 `http://localhost:3000`。开发完成后，按照以下顺序检查项目：

```bash
pnpm check
pnpm test
pnpm build
```

`pnpm build` 会生成静态前端目录 `dist/public/`，同时把 Node 服务端打包为 `dist/index.js`。如需验证完整构建产物，可执行：

```bash
pnpm start
```

## 4. 项目目录与文件说明

以下文件是初学者最常需要阅读或修改的部分。`node_modules/`、`dist/`、运行日志与锁文件一般均为自动生成内容，不建议直接编辑。

| 路径 | 作用 | 什么时候修改 |
| --- | --- | --- |
| `client/index.html` | Vite HTML 入口、页面标题、视口和分析脚本 | 调整基础 Meta 或页面标题 |
| `client/src/main.tsx` | React、React Query、tRPC 启动入口 | 一般无需修改 |
| `client/src/App.tsx` | 顶层路由、主题提供器、全局提示 | 新增页面或调整全局外壳 |
| `client/src/pages/Home.tsx` | 主页面：分类树、搜索、导入导出、默认数据、云端备份 UI | 调整绝大多数页面功能 |
| `client/src/index.css` | 档案风格视觉系统、卡片、侧栏、移动端断点 | 改颜色、尺寸、布局、触控体验 |
| `client/src/lib/bookmarks.ts` | 书签类型、JSON 规范化、HTML、XLSX、CSV 解析、图标 URL、合并和多格式导出 | 改数据格式、图标服务、导入规则 |
| `client/src/lib/standalone.ts` | 生成可离线双击打开的完整导航 HTML | 改离线导出页面功能 |
| `client/src/contexts/ThemeContext.tsx` | 日夜模式状态 | 改默认主题或切换机制 |
| `client/src/_core/hooks/useAuth.ts` | 当前登录用户、登录状态和退出操作 | 调整云端备份的登录体验 |
| `client/public/data/default-bookmarks.json` | 默认公开书签目录 | 更新默认导航数据 |
| `client/public/data/README.md` | 默认 JSON 的短格式说明 | 忘记字段规则时先阅读 |
| 受管理文件存储 `/manus-storage/archive-index-logo_491f7249.png` | 当前品牌 Logo 地址 | 替换 Logo 时上传新文件并更新 `Home.tsx` 的 `LOGO_URL` |
| `server/routers.ts` | tRPC API：登录、备份保存、列表、授权读取 | 新增服务端接口或权限规则 |
| `server/bookmarkBackups.ts` | JSON 校验、书签计数、文件名清理、对象键生成 | 改备份规则或文件大小限制 |
| `server/storage.ts` | 受管理对象存储封装 | 通常不修改；不要把文件正文写进数据库 |
| `server/db.ts` | 用户与备份元数据的数据库读写函数 | 扩展查询或数据访问逻辑 |
| `drizzle/schema.ts` | 数据库模型，含 `users` 和 `bookmark_backups` | 新增表、字段或索引时先改此文件 |
| `drizzle/0000_thick_shinobi_shaw.sql` | 备份表与索引的已执行迁移记录 | 仅供历史参考；后续修改应生成新迁移 |
| `server/bookmarkBackups*.test.ts` | 云端备份校验与路由授权测试 | 修改存储逻辑后必须运行 `pnpm test` |
| `.github/workflows/deploy-gh-page.yml` | 从 `main` 构建并推送静态成品到 `gh-page` 分支 | 改静态发布工作流 |
| `vite.config.ts` | Vite 构建配置；`base: "./"` 保证相对路径 | 改构建目录或资源基路径 |
| `netlify.toml`、`vercel.json`、`wrangler.toml` | 三个平台的静态部署配置 | 对应平台项目名或构建要求变化时 |
| `client/src/lib/bookmarks.spreadsheet.test.ts` | CSV、XLSX 的分类路径重建和双向转换回归测试 | 修改表格格式后必须运行 `pnpm test` |
| `scripts/*.mjs` | 默认数据合并、导入回归、离线导出回归脚本 | 调整数据转换或回归验证时 |
| `todo.md` | 每轮功能修改与验证记录 | 跟踪后续开发工作 |

## 5. 默认 `default-bookmarks.json`：结构与修改方法

默认数据文件的绝对路径是：

```text
/home/ubuntu/bookmark-navigation/client/public/data/default-bookmarks.json
```

页面通过相对路径 `./data/default-bookmarks.json` 读取它，因此网站部署在根域名、GitHub Pages 仓库子路径或其他静态平台时，默认数据都能与页面一起加载。

文件根部包含一个便于人工维护的版本字符串和 `bookmarks` 数组。节点只有 `folder` 和 `bookmark` 两类；分类的 `children` 可以无限嵌套分类与网址。

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
          "title": "示例站点",
          "url": "https://example.com/",
          "description": "可选说明",
          "iconSource": "favicon_im"
        }
      ]
    }
  ]
}
```

| 字段 | 适用节点 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `id` | 分类、书签 | 是 | 同一份文件中保持唯一，建议使用稳定且有语义的英文 ID |
| `type` | 分类、书签 | 建议填写 | `folder` 或 `bookmark`；程序也会依据 `children` 和 `url` 识别节点 |
| `title` | 分类、书签 | 是 | 页面显示名称；空值会被规范化为“未命名项目” |
| `children` | 分类 | 是 | 子分类和子书签数组；数组存在时会按分类处理 |
| `url` | 书签 | 是 | 必须是 `http://` 或 `https://` 开头的有效网址 |
| `description` | 书签 | 否 | 用于站内搜索和数据语义；当前卡片不直接显示 |
| `iconSource` | 书签 | 否 | 例如 `favicon_im`、`favicon_iowen`、`favicon_baidu`、`google`、`logo_surf`、`custom`、`iconify` |
| `customIcon` | 书签 | 条件必填 | 当 `iconSource` 为 `custom` 时填写图片 URL |
| `iconifyIcon` | 书签 | 条件必填 | 当 `iconSource` 为 `iconify` 时填写图标名，例如 `logos:github-icon` |

### 安全修改步骤

1. 在网页中先导入、整理与搜索验证书签。
2. 使用“导出 JSON”，在电脑上留存一份可回滚副本。
3. 将确认后的内容覆盖到 `client/public/data/default-bookmarks.json`。
4. 检查逗号、双引号、花括号与数组括号是否完整，并确认 ID 不重复、URL 为 HTTP/HTTPS。
5. 运行 `pnpm check && pnpm build`。

默认目录是公开资源，不应写入私人、工作机密或临时链接。个人数据应当留在 LocalStorage 或登录后同步至云端备份。

### 默认数据与本地数据的优先级

首次访问会加载默认目录并写入 LocalStorage。之后，用户导入、覆盖、恢复或同步过的数据会优先于默认目录，更新默认 JSON 不会覆盖已有用户书签。若要让当前浏览器重新加载默认目录，请在浏览器开发者工具的 Application / Storage 面板中删除：

```text
archive-index-bookmarks
archive-index-default-version
```

然后刷新页面即可。

## 6. 导入、导出与云端同步

### 6.1 导入 JSON、浏览器 HTML、XLSX 或 CSV

打开 **数据工具 → 导入 JSON / HTML / XLSX / CSV**，选择文件后系统会解析书签，并提示选择导入策略。

| 策略 | 结果 | 适用场景 |
| --- | --- | --- |
| 覆盖导入 | 用本次文件完整替换当前浏览器书签 | 切换到另一套目录或重建导航 |
| 增量导入 | 同名分类递归合并、URL 去重，新增内容保留原顺序 | 周期性导入浏览器新增书签 |

JSON 可以直接保留完整字段。HTML 导入遵循标准浏览器书签结构，目录与网址顺序会被保留。XLSX 和 CSV 使用“每行一个网址”的交换格式，导入时会按“分类路径”自动创建或复用文件夹，因此左侧分类树也会同步生成多级结构。

### 6.2 XLSX 与 CSV 表格格式

导出 XLSX 或 CSV 后，第一行会写入标准列名；用户可以在 Excel、WPS、LibreOffice 或文本编辑器中修改内容，再重新导入。CSV 使用 UTF-8 BOM，便于常见中文表格软件正确识别文字编码。

| 列名 | 是否必填 | 示例 | 作用 |
| --- | --- | --- | --- |
| `分类路径` | 否 | `工作 / 开发 / 前端` | 使用 `/` 分隔层级；同一路径会自动合并为同一套多级分类 |
| `名称` | 否 | `Vite` | 书签显示名称；为空时会使用网址域名 |
| `网址` | 是 | `https://vite.dev/` | 必须以 `http://` 或 `https://` 开头；无效行会被忽略 |
| `说明` | 否 | `前端构建工具` | 用于站内搜索和数据语义 |
| `图标来源` | 否 | `favicon_im` | 使用站内支持的图标来源名称 |
| `自定义图标` | 否 | `https://example.com/logo.png` | 当图标来源为 `custom` 时使用 |
| `Iconify 图标` | 否 | `logos:vitejs` | 当图标来源为 `iconify` 时使用 |

下方示例会导入为“工作 → 开发 → 前端”和“生活”两组左侧分类；不填写分类路径的书签会作为根级书签导入。

```csv
分类路径,名称,网址,说明,图标来源,自定义图标,Iconify 图标
工作 / 开发 / 前端,Vite,https://vite.dev/,前端构建工具,favicon_im,,
生活,示例站点,https://example.com/,演示网址,,,
```

导入表格后仍可选择**覆盖导入**或**增量导入**。增量模式会递归合并同名分类、按 URL 去重；表格中的分类路径会先被还原为书签树，再进入同一套合并逻辑。

### 6.3 从 LocalStorage 迁移到云端

以前网页导入的数据仅保存在浏览器的 `archive-index-bookmarks` 键中，不会出现在项目文件夹。现在请打开 **数据工具**，完成登录后点击 **同步当前数据**。系统会把当前书签序列化为 JSON、保存到对象存储，并在 `bookmark_backups` 表中登记元数据。

之后，登录状态下导入 JSON、HTML、XLSX 或 CSV 并确认覆盖或增量导入时，系统会把**解析后的书签树**规范化为 JSON 并创建一份云端备份。备份列表显示最近 20 份记录；点击 **恢复** 会先通过用户所属关系校验，再读取备份并覆盖当前浏览器的 LocalStorage 数据。恢复前建议先导出 JSON 或 XLSX。

### 6.4 导出校验

| 项目 | 当前值 |
| --- | --- |
| 账号 | `admin` |
| 密码 | `123456` |

五种导出都要求上述校验：**JSON** 适合完整数据备份；**浏览器书签 HTML** 可被 Chrome、Edge、Firefox 等浏览器导入；**XLSX** 适合在电子表格中批量整理；**CSV** 适合文本、数据库与其他系统交换；**离线单页导航 HTML** 可本地双击打开，保留目录、搜索、主题、图标与数据工具等核心体验。离线导出文件中的账号校验同样是浏览器端便利校验，而非安全保护。

## 7. 响应式设计与使用方式

页面为不同设备采用不同的目录浏览方式，并考虑到 3,710 个默认入口带来的长页面性能压力。

| 视口 | 主要体验 |
| --- | --- |
| 1280px 及以上 | 固定左侧分类脊柱、自动多列网址卡片、完整的顶部工具栏 |
| 841px–1180px | 保留侧栏和双/多列书签网格，压缩内容区留白 |
| 611px–840px | 顶部品牌区、横向分类索引、可展开的完整目录入口 |
| 610px 及以下 | 单列卡片、放大输入框和触控目标、无文字工具按钮、竖向导出验证操作 |

右下角向上箭头在页面滚动超过一定距离后出现；日夜模式会被浏览器记住。长目录区使用 `content-visibility` 减少离屏渲染，移动端分类索引支持横向滚动。

## 8. 静态发布：GitHub Pages、Cloudflare、Vercel 与 Netlify

项目采用 `base: "./"` 和相对路径默认数据，因此静态网页可部署到根域名或仓库子路径。以下静态平台均发布 `dist/public/`：它们支持默认数据、分类、搜索、本地导入、导出与主题；**不运行 Express/tRPC 服务端，因此不支持登录、云端备份与恢复**。

| 发布目标 | 构建命令 | 发布目录 | 云端备份 |
| --- | --- | --- |
| GitHub Pages | GitHub Actions 内置执行 `pnpm check` 与 `pnpm build` | `gh-page` 分支根目录 | 不支持 |
| Cloudflare Pages | `pnpm build` | `dist/public` | 不支持 |
| Vercel 静态输出 | `pnpm build` | `dist/public` | 不支持 |
| Netlify 静态站点 | `pnpm build` | `dist/public` | 不支持 |
| 支持 Node、数据库和对象存储的全栈环境 | `pnpm build && pnpm start` | 前端 + `dist/index.js` | 支持 |

### 8.1 GitHub Pages：构建并推送 `gh-page` 分支

项目提供 `.github/workflows/deploy-gh-page.yml`。它在 `main` 分支推送或手动触发时安装依赖、检查类型、构建 `dist/public/`，并将成品推送到独立的 `gh-page` 分支。

1. 将项目推送到 GitHub 的 `main` 分支。
2. 打开仓库 **Settings → Actions → General**，将 Workflow permissions 设为 **Read and write permissions**。
3. 等待 **Build and publish gh-page** 工作流成功。
4. 打开 **Settings → Pages**，选择 **Deploy from a branch**，分支选 `gh-page`，目录选 `/(root)`。
5. 保存后访问 GitHub 提供的 Pages 地址。

> GitHub Pages 可以从指定分支发布静态内容，因此构建产物推送至 `gh-page` 后可从该分支根目录发布。[1]

### 8.2 Cloudflare Pages

在 Cloudflare Dashboard 中创建 Pages 项目并连接 GitHub 仓库。填写构建命令 `pnpm build`、构建输出目录 `dist/public`、Node.js 版本 22。使用命令行时可运行：

```bash
pnpm build
pnpm dlx wrangler pages deploy dist/public --project-name bookmark-navigation
```

项目中的 `wrangler.toml` 已声明 `pages_build_output_dir = "dist/public"`。Cloudflare Pages 支持自定义构建命令与输出目录。[2]

### 8.3 Vercel

导入 GitHub 仓库后确认以下设置。`vercel.json` 已包含安装、构建、输出目录与 SPA 回退规则。

| 设置 | 值 |
| --- | --- |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | `dist/public` |
| Node.js | 22 |

也可在本地安装 Vercel CLI 后运行 `pnpm build && vercel --prod`。Vercel 为 Vite 应用提供构建与部署指导。[3]

### 8.4 Netlify

在 Netlify 中选择 **Add new site → Import an existing project**，连接仓库后确认：

| 设置 | 值 |
| --- | --- |
| Build command | `pnpm build` |
| Publish directory | `dist/public` |
| Node.js | 22 |

项目根目录的 `netlify.toml` 已写入相同配置。命令行发布可运行：

```bash
pnpm build
pnpm dlx netlify deploy --dir=dist/public --prod
```

Netlify 的 Vite 指引同样使用构建命令与发布目录配置。[4]

## 9. 全栈部署与环境边界

若要使用登录、云端备份和恢复，不能只部署 `dist/public/`。完整运行需要 Node 服务端、MySQL 数据库、OAuth 相关环境变量与受管理对象存储。项目模板已在当前全栈环境中注入所需的系统变量；不要把真实密钥写进源码或提交 `.env` 文件。

云端备份表为 `bookmark_backups`。如后续修改数据库模型，请遵循以下顺序：先改 `drizzle/schema.ts`，执行 `pnpm drizzle-kit generate`，检查生成 SQL，再执行迁移。不要用数据库 BLOB 存 JSON 文件内容，也不要依赖服务器临时目录保存用户上传文件。

## 10. 验证与维护命令

| 命令 | 用途 |
| --- | --- |
| `pnpm check` | TypeScript 类型检查 |
| `pnpm test` | 运行登录、JSON 校验、备份保存/列表/授权读取等单元与集成测试 |
| `pnpm build` | 构建前端静态产物与 Node 服务端 |
| `pnpm exec tsx scripts/bookmark-import-smoke.mjs` | 验证 HTML 书签解析和递归增量合并 |
| `pnpm exec tsx scripts/standalone-export-smoke.mjs` | 验证离线单页导航导出结构 |
| `pnpm dev` | 启动本地全栈开发服务 |
| `pnpm start` | 启动已构建的完整 Node 服务 |

推荐维护顺序是：在网页中验证操作，再运行 `pnpm check`、`pnpm test` 和 `pnpm build`；确认默认目录不包含隐私链接后，再提交代码。GitHub `main` 分支更新后，工作流会重新构建静态版并推送 `gh-page`。

## 11. 常见问题

| 问题 | 排查方式 |
| --- | --- |
| 网站仍显示旧书签 | 删除 LocalStorage 中的 `archive-index-bookmarks` 与 `archive-index-default-version`，再刷新 |
| 修改默认 JSON 后没有变化 | 确认修改的是 `client/public/data/default-bookmarks.json`，并重新执行 `pnpm build` |
| 导入后左侧没有分类 | 检查 JSON 的分类节点是否包含 `children` 数组，或确认 HTML 是浏览器标准书签导出格式 |
| JSON 导入后没有云端备份 | 登录后重新导入并选择覆盖/增量；旧 LocalStorage 数据可点击“同步当前数据” |
| 云端备份无法恢复 | 使用保存时相同的登录账号；恢复会覆盖当前浏览器书签，建议先导出 JSON |
| 导出账号无法通过 | 使用账号 `admin`、密码 `123456`，并检查是否输入了额外空格 |
| GitHub Pages 显示 404 | 确认 Actions 已成功推送 `gh-page`，再检查 Pages 的来源为 `gh-page / (root)` |
| 部署后图标不显示 | 图标由第三方服务提供，网络或站点策略可能阻止请求；切换图标来源即可 |
| 静态平台没有云端备份入口 | 静态托管不运行后端；请使用完整全栈部署环境 |
| 想让导入文件落到服务器文件夹 | 项目使用对象存储，键前缀为 `bookmark-backups/`；这比临时服务器目录更适合线上持久化 |

## References

[1] [GitHub Docs：Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

[2] [Cloudflare Pages Docs：Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

[3] [Vercel Docs：Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[4] [Netlify Docs：Vite framework guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
