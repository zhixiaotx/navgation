# 外部备份环境变量示例

本文件是项目根目录中**可见且不含真实凭据**的外部备份变量模板。请将变量实际值设置到项目的安全环境变量面板；不要创建或提交包含真实值的 `.env` 文件。

填写变量后重启服务，打开网站 **设置 → 外部备份**，对应卡片会从“待配置”变为“已配置”。页面不会显示密码、API Token 或代理令牌。

```dotenv
# 坚果云 WebDAV：使用第三方应用密码，而非网页登录密码。
NUTSTORE_WEBDAV_URL=
NUTSTORE_WEBDAV_USERNAME=
NUTSTORE_WEBDAV_APP_PASSWORD=

# Cloudflare Workers KV：Token 只授予目标账户与目标命名空间的最小写入权限。
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_KV_NAMESPACE_ID=

# Cloudflare D1：通过受认证 Worker 代理访问；不要把 SQL 接口公开到浏览器。
CLOUDFLARE_D1_PROXY_URL=
CLOUDFLARE_D1_PROXY_TOKEN=
```

| 备份目标 | 需要的变量 | 启用条件 |
| --- | --- | --- |
| 坚果云 WebDAV | `NUTSTORE_WEBDAV_URL`、`NUTSTORE_WEBDAV_USERNAME`、`NUTSTORE_WEBDAV_APP_PASSWORD` | 三项均存在 |
| Cloudflare KV | `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_KV_NAMESPACE_ID` | 三项均存在 |
| Cloudflare D1 | `CLOUDFLARE_D1_PROXY_URL`、`CLOUDFLARE_D1_PROXY_TOKEN` | 两项均存在 |

## 安全步骤

1. 只选择需要启用的一种或多种目标。
2. 将上述**变量名**与真实值添加到项目管理界面的安全环境变量区域。
3. 重启全栈服务后，在 **设置 → 外部备份** 查看状态。
4. 先用一份不敏感的测试书签执行一次备份，再验证对应目标中是否生成文件、KV 键或 Worker 记录。

> 变量只供服务端进程读取。不要在浏览器 LocalStorage、书签数据、前端源码、README 示例以外的普通文本或截图中保存真实值。
