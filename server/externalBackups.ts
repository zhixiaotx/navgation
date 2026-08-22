export type ExternalBackupTarget = "nutstore" | "cloudflare_kv" | "cloudflare_d1";

export type ExternalBackupConfig = {
  nutstoreUrl?: string;
  nutstoreUsername?: string;
  nutstorePassword?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  cloudflareKvNamespaceId?: string;
  cloudflareD1ProxyUrl?: string;
  cloudflareD1ProxyToken?: string;
};

export type ExternalBackupPayload = {
  userId: number;
  fileName: string;
  content: string;
  bookmarkCount: number;
  createdAt?: Date;
};

export function getExternalBackupConfig(env: NodeJS.ProcessEnv = process.env): ExternalBackupConfig {
  return {
    nutstoreUrl: env.NUTSTORE_WEBDAV_URL?.trim(),
    nutstoreUsername: env.NUTSTORE_WEBDAV_USERNAME?.trim(),
    nutstorePassword: env.NUTSTORE_WEBDAV_APP_PASSWORD,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID?.trim(),
    cloudflareApiToken: env.CLOUDFLARE_API_TOKEN,
    cloudflareKvNamespaceId: env.CLOUDFLARE_KV_NAMESPACE_ID?.trim(),
    cloudflareD1ProxyUrl: env.CLOUDFLARE_D1_PROXY_URL?.trim(),
    cloudflareD1ProxyToken: env.CLOUDFLARE_D1_PROXY_TOKEN,
  };
}

export function getExternalBackupStatus(config = getExternalBackupConfig()) {
  return {
    nutstore: Boolean(config.nutstoreUrl && config.nutstoreUsername && config.nutstorePassword),
    cloudflareKv: Boolean(config.cloudflareAccountId && config.cloudflareApiToken && config.cloudflareKvNamespaceId),
    cloudflareD1: Boolean(config.cloudflareD1ProxyUrl && config.cloudflareD1ProxyToken),
  };
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function requireTargetConfig(target: ExternalBackupTarget, config: ExternalBackupConfig) {
  const status = getExternalBackupStatus(config);
  if (target === "nutstore" && !status.nutstore) throw new Error("坚果云 WebDAV 尚未在项目安全设置中完成配置。");
  if (target === "cloudflare_kv" && !status.cloudflareKv) throw new Error("Cloudflare KV 尚未在项目安全设置中完成配置。");
  if (target === "cloudflare_d1" && !status.cloudflareD1) throw new Error("Cloudflare D1 Worker 代理尚未在项目安全设置中完成配置。");
}

async function assertResponse(response: Response, provider: string) {
  if (response.ok) return;
  const detail = (await response.text()).slice(0, 280);
  throw new Error(`${provider} 备份失败（${response.status}）。${detail || "请检查服务端凭据和访问权限。"}`);
}

export async function saveExternalBackup(target: ExternalBackupTarget, payload: ExternalBackupPayload, config = getExternalBackupConfig()): Promise<{ target: ExternalBackupTarget; location: string }> {
  requireTargetConfig(target, config);
  const createdAt = payload.createdAt ?? new Date();
  const stamp = createdAt.toISOString().replace(/[:.]/g, "-");
  const fileName = safeSegment(payload.fileName.toLowerCase().endsWith(".json") ? payload.fileName : `${payload.fileName}.json`);

  if (target === "nutstore") {
    const base = config.nutstoreUrl!.endsWith("/") ? config.nutstoreUrl! : `${config.nutstoreUrl!}/`;
    const path = `bookmark-navigation/${payload.userId}/${stamp}-${fileName}`;
    const response = await fetch(new URL(path, base), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${Buffer.from(`${config.nutstoreUsername}:${config.nutstorePassword}`).toString("base64")}`,
      },
      body: payload.content,
    });
    await assertResponse(response, "坚果云 WebDAV");
    return { target, location: path };
  }

  if (target === "cloudflare_kv") {
    const key = `bookmark-navigation/${payload.userId}/latest.json`;
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.cloudflareAccountId!)}/storage/kv/namespaces/${encodeURIComponent(config.cloudflareKvNamespaceId!)}/values/${encodeURIComponent(key)}`;
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { Authorization: `Bearer ${config.cloudflareApiToken}`, "Content-Type": "application/json; charset=utf-8" },
      body: payload.content,
    });
    await assertResponse(response, "Cloudflare KV");
    return { target, location: key };
  }

  const response = await fetch(config.cloudflareD1ProxyUrl!, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.cloudflareD1ProxyToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "save_bookmark_backup",
      payload: {
        userId: payload.userId,
        fileName,
        bookmarkCount: payload.bookmarkCount,
        createdAt: createdAt.toISOString(),
        content: payload.content,
      },
    }),
  });
  await assertResponse(response, "Cloudflare D1 Worker");
  return { target, location: config.cloudflareD1ProxyUrl! };
}
