# 外部备份环境变量示例

本文件是**不含真实凭据**的填写模板。请不要提交实际的 `.env` 文件，也不要将密码或令牌粘贴到书签、前端源码或浏览器本地存储中。

在本地全栈开发环境中，可按下列名称创建未提交的运行环境变量；在托管环境中，请在平台的安全环境变量页面逐项创建同名变量。填写后重启服务，再到网站 **设置 → 外部备份** 查看“已配置”状态。

```dotenv
# 坚果云 WebDAV：第三方应用密码，不是网页登录密码。
NUTSTORE_WEBDAV_URL=
NUTSTORE_WEBDAV_USERNAME=
NUTSTORE_WEBDAV_APP_PASSWORD=

# Cloudflare Workers KV：API Token 应仅拥有目标账户和目标命名空间的必要写入权限。
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_KV_NAMESPACE_ID=

# Cloudflare D1：使用受认证的 Worker 代理，不要向浏览器暴露原始 D1 SQL 接口。
CLOUDFLARE_D1_PROXY_URL=
CLOUDFLARE_D1_PROXY_TOKEN=
```

| 备份目标 | 必填变量 | 站内状态条件 |
| --- | --- | --- |
| 坚果云 WebDAV | `NUTSTORE_WEBDAV_URL`、`NUTSTORE_WEBDAV_USERNAME`、`NUTSTORE_WEBDAV_APP_PASSWORD` | 三项均存在 |
| Cloudflare KV | `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_KV_NAMESPACE_ID` | 三项均存在 |
| Cloudflare D1 | `CLOUDFLARE_D1_PROXY_URL`、`CLOUDFLARE_D1_PROXY_TOKEN` | 两项均存在 |

> 变量的具体值只供服务端进程使用；网页不会回显密码、API Token 或代理令牌。
