# 外部备份接入调研（2026-08-22）

## 坚果云 WebDAV

坚果云官方帮助说明，第三方应用应使用单独生成的**应用授权密码**，并在支持 WebDAV 的客户端或服务端中填写服务器地址、账户和对应的应用密码。其 WebDAV 访问可上传、下载和管理文件；免费账户的请求频率限制为每 30 分钟不超过 600 次。

本项目的实现边界是：使用服务端保存的 WebDAV 地址、账户与应用密码，通过 Basic Auth 将规范化的 JSON 备份写入专用目录；浏览器不直接获得或存储这些凭据。

来源：[坚果云第三方应用授权 WebDAV 开启方法](https://help.jianguoyun.com/?p=2064)

## Cloudflare Workers KV

Cloudflare 官方文档指出，Workers KV 是可通过 Worker 绑定或 REST API 访问的全球键值存储。外部应用可以向账户 ID、KV 命名空间 ID 和键名对应的 REST 路径写入或读取值。

本项目适合将**最新规范化 JSON 快照**写入一个固定的 KV 键；需要在服务端安全保存 Cloudflare API 令牌、账户 ID 和命名空间 ID。KV 更适合作为快照副本而非复杂查询系统。

来源：[Cloudflare Workers KV](https://developers.cloudflare.com/kv/)

## Cloudflare D1

Cloudflare 官方 D1 指南说明，D1 内置 REST API 更适合管理用途；供外部应用使用时，建议创建带认证、访问控制和参数验证的 Worker 代理 API。D1 适合保存备份元数据、索引和历史记录，而 JSON 正文可保留在受管理对象存储或 KV。

本项目不会将任意 SQL 暴露给浏览器。若启用 D1，建议使用用户配置的受认证 Worker 代理地址与专用访问密钥，并限制为预定义的备份写入、列出和读取操作。

来源：[Build an API to access D1 using a proxy Worker](https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/)
