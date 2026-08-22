# 书签导航（Archive Index）

> 将浏览器书签转换为支持多级分类、搜索、主题、图标、导入导出与可选云端备份的单页导航。

本文件是项目的**入口说明**。为避免长文阅读器在后半部分截断，设置、外部备份、部署和维护内容已经拆分到项目根目录的独立 Markdown 文件；它们会与 README 一起在项目文件列表中显示。

## 文档导航

| 文档 | 阅读内容 | 何时阅读 |
| --- | --- | --- |
| `README.md`（本文件） | 项目概览、目录、数据结构、数据工具、导入导出 | 首次使用项目 |
| [`SETTINGS_AND_BACKUP.md`](SETTINGS_AND_BACKUP.md) | 设置面板、分类/书签管理、云端与外部备份 | 管理书签或启用备份 |
| [`EXTERNAL_BACKUP_ENVIRONMENT.md`](EXTERNAL_BACKUP_ENVIRONMENT.md) | WebDAV、Cloudflare KV/D1 的环境变量模板 | 配置外部备份前 |
| [`DEPLOYMENT_AND_MAINTENANCE.md`](DEPLOYMENT_AND_MAINTENANCE.md) | 响应式说明、GitHub Pages、Cloudflare、Vercel、Netlify、维护与 FAQ | 部署、排错或开发 |
| `external-backup-research.md` | 坚果云与 Cloudflare 的调研来源及安全边界 | 修改外部备份适配器前 |

> **安全提醒：** 导出时的 `admin / 123456` 是前端便利校验，不是安全认证。默认数据会作为公开静态文件发布；不要将私密链接、账号、密码或令牌写入默认 JSON、前端源码或浏览器本地存储。

## 1. 功能概览

| 功能 | 当前行为 |
| --- | --- |
| 默认目录 | 内置极光Tab与 WebDesk 合并数据，共 3,710 个入口，使用相对路径加载 |
| 多级分类 | 左侧可递归展开/收起；点击分类只跳转右侧位置，不会筛选隐藏其他内容 |
| 搜索与主题 | 站内即时筛选、20 个国内外站外搜索引擎、日夜模式和一键回顶 |
| 图标 | 默认 `favicon.im`，支持国内优先回退、直连 favicon、Google S2、Iconify、文字和自定义图标 |
| 导入 | 标准 JSON、极光Tab/WebDesk 原始 JSON、浏览器 HTML、XLSX、CSV；导入前显示摘要和样本预览 |
| 导出 | JSON、浏览器 HTML、XLSX、CSV、离线单页导航 HTML；全部需要便利校验 |
| 数据工具 | 顶部独立入口，提供导入、五类导出、XLSX/CSV 空白模板下载 |
| 设置管理 | 分类、书签、批量操作、本地恢复、云端备份恢复与外部备份状态 |
| 备份 | 本地优先；登录后可使用对象存储 + MySQL 管理 JSON 云端备份 |

## 2. 数据保存位置

| 数据 | 实际位置 | 说明 |
| --- | --- | --- |
| 默认书签 | `client/public/data/default-bookmarks.json` | 公开静态数据；首次访问时以 `./data/default-bookmarks.json` 读取 |
| 当前书签 | LocalStorage：`archive-index-bookmarks` | 优先于默认数据；导入、恢复、编辑后立即写入 |
| 默认版本 | LocalStorage：`archive-index-default-version` | 控制首次初始化与旧数据迁移 |
| 清空标记 | LocalStorage：`archive-index-cleared` | 清除后刷新也不会重新灌入默认数据 |
| 云端备份正文 | 受管理对象存储：`bookmark-backups/<用户 ID>/…` | 仅登录用户通过服务端授权访问 |
| 云端备份索引 | MySQL：`bookmark_backups` | 保存文件名、大小、书签数、来源和创建时间 |

> 不将导入文件写入服务器临时目录。自动伸缩环境的磁盘可能随重启或部署清空；云端 JSON 正文应在对象存储中持久保存。

## 3. 最快上手

需要 Node.js 22 与 npm。项目根目录执行：

```bash
npm ci
npm run dev
```

常用检查命令：

```bash
npm run check
npm test
npm run build
```

`npm run build` 会生成 `dist/public/` 静态前端及 `dist/index.js` Node 服务端。完整全栈构建产物可用 `npm run start` 运行。

## 4. 重要文件与目录

| 路径 | 作用 | 修改时机 |
| --- | --- | --- |
| `client/src/pages/Home.tsx` | 主页面、数据工具、设置面板、LocalStorage、导入导出和备份交互 | 调整页面功能 |
| `client/src/index.css` | 档案风格、卡片、模态、书签管理和响应式规则 | 调整视觉或断点 |
| `client/src/lib/bookmarks.ts` | 书签类型、JSON/HTML/XLSX/CSV 解析、原始 JSON 兼容、图标、合并和导出 | 修改格式或解析规则 |
| `client/src/lib/bookmarkManager.ts` | 分类/书签的不可变创建、编辑、移动、排序、批处理 | 修改管理规则 |
| `client/src/lib/standalone.ts` | 离线单页导航 HTML 的生成器 | 修改离线导出功能 |
| `client/public/data/default-bookmarks.json` | 默认公开书签树 | 更新默认导航 |
| `server/routers.ts` | tRPC：云端备份、外部备份状态与写入 | 扩展服务端功能 |
| `server/bookmarkBackups.ts`、`server/storage.ts` | 备份校验、存储键和对象存储 | 改云端备份策略 |
| `server/externalBackups.ts` | 坚果云、Cloudflare KV、D1 Worker 代理的服务端适配器 | 改外部备份协议 |
| `drizzle/schema.ts`、`drizzle/*.sql` | 数据库模型和迁移历史 | 改表或字段时先改模型再生成迁移 |
| `scripts/*.mjs` | 默认数据合并、导入回归、离线导出回归 | 修改数据转换或回归流程 |
| `client/src/lib/*.test.ts`、`server/*.test.ts` | 书签管理、表格、云端/外部备份测试 | 修改逻辑后必须运行 |
| `SETTINGS_AND_BACKUP.md` | 设置与备份完整说明 | 管理或备份数据前阅读 |
| `EXTERNAL_BACKUP_ENVIRONMENT.md` | 不含真实值的外部备份环境变量模板 | 配置服务端变量前阅读 |
| `DEPLOYMENT_AND_MAINTENANCE.md` | 部署、命令、FAQ 和引用 | 部署或排错时阅读 |

`node_modules/`、`dist/`、`drizzle/meta/`、运行日志和锁文件是依赖或构建产物，通常不直接修改。`server/_core/` 是 OAuth、tRPC、对象存储和开发服务器基础设施，除非扩展底层能力，否则不要修改。

## 5. 默认数据 `default-bookmarks.json`

默认数据文件位置：

```text
/home/ubuntu/bookmark-navigation/client/public/data/default-bookmarks.json
```

文件根部包含 `version` 与 `bookmarks`。节点分为 `folder` 和 `bookmark`；分类可无限嵌套。

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

| 字段 | 适用节点 | 要求 |
| --- | --- | --- |
| `id` | 分类、书签 | 同一文件内唯一 |
| `type` | 分类、书签 | `folder` 或 `bookmark`；也会根据 `children`、`url` 推断 |
| `title` | 分类、书签 | 必填；为空时规范化为“未命名项目” |
| `children` | 分类 | 子分类和子书签数组 |
| `url` | 书签 | 必须是 `http://` 或 `https://` |
| `description` | 书签 | 可选；用于搜索和数据语义 |
| `iconSource` | 书签 | 可选，例如 `favicon_im`、`favicon_iowen`、`google`、`logo_surf`、`custom`、`iconify` |
| `customIcon` / `iconifyIcon` | 书签 | 对应 `custom` / `iconify` 时填写 |

修改默认数据前，先从网页导出 JSON 备份，再替换该文件，最后运行 `npm run check && npm run build`。更新默认 JSON 不会覆盖已写入 LocalStorage 的当前浏览器书签；如需重新加载默认目录，请删除 `archive-index-bookmarks` 和 `archive-index-default-version` 后刷新。

## 6. 数据工具：导入与导出

### 6.1 导入前预览与策略

顶部 **数据工具** 是最快入口；**设置 → 备份与恢复** 也提供本地恢复。选择 JSON、HTML、XLSX 或 CSV 后，系统会先显示文件名、书签数、分类数、目录深度和样本。只有选择策略并确认后，当前书签才会改变。

| 策略 | 结果 | 适用场景 |
| --- | --- | --- |
| 覆盖导入 | 用本次文件完整替换当前书签 | 切换一整套目录 |
| 增量导入 | 同名分类递归合并、URL 去重、保持新增项目顺序 | 周期导入浏览器新增书签 |

标准书签 JSON、极光Tab/WebDesk 原始 JSON、浏览器 HTML、XLSX、CSV 均会转换为同一棵书签树。表格的“分类路径”会自动创建多级左侧分类；导入前可选择默认 `/` 或自定义 `>`、`|`、`→` 等路径分隔符，并可点击“导入示例到预览”先查看结果而不写入当前书签。字段在线说明会解释每一列的用途和填写条件。

### 6.2 XLSX 与 CSV

数据工具提供 XLSX/CSV 空白模板下载。表格每行代表一个网址，标准列如下：

| 列名 | 必填 | 示例 |
| --- | --- | --- |
| `分类路径` | 否 | `工作 / 开发 / 前端` |
| `名称` | 否 | `Vite` |
| `网址` | 是 | `https://vite.dev/` |
| `说明` | 否 | `前端构建工具` |
| `图标来源` | 否 | `favicon_im` |
| `自定义图标` | 否 | `https://example.com/logo.png` |
| `Iconify 图标` | 否 | `logos:vitejs` |

CSV 使用 UTF-8 BOM，便于中文表格软件识别。导入后仍可选择覆盖或增量策略。

### 6.3 导出便利校验

JSON、浏览器书签 HTML、XLSX、CSV、离线单页导航 HTML 都要求输入下列便利校验：

| 账号 | 密码 |
| --- | --- |
| `admin` | `123456` |

该校验只用于减少误操作，不能保护私密数据。离线单页导航保留目录、搜索、主题、图标和数据工具等核心体验。

## 7. 下一步：设置、备份、部署与维护

长篇后续说明已拆分，因此不会在本 README 的第 6.5 节之后被阅读器截断：

1. 阅读 [`SETTINGS_AND_BACKUP.md`](SETTINGS_AND_BACKUP.md)，了解分类/书签管理、本地恢复、云端备份与外部备份。
2. 阅读 [`EXTERNAL_BACKUP_ENVIRONMENT.md`](EXTERNAL_BACKUP_ENVIRONMENT.md)，复制外部备份所需变量名称到项目安全环境变量面板。
3. 阅读 [`DEPLOYMENT_AND_MAINTENANCE.md`](DEPLOYMENT_AND_MAINTENANCE.md)，完成 GitHub Pages、Cloudflare、Vercel、Netlify 或全栈部署，并了解维护命令和常见问题。
