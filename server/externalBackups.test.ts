import { afterEach, describe, expect, it, vi } from "vitest";
import { getExternalBackupStatus, saveExternalBackup } from "./externalBackups";

const config = {
  nutstoreUrl: "https://dav.example.test/dav/",
  nutstoreUsername: "account@example.test",
  nutstorePassword: "app-password",
  cloudflareAccountId: "account-id",
  cloudflareApiToken: "token",
  cloudflareKvNamespaceId: "namespace-id",
  cloudflareD1ProxyUrl: "https://backup.example.test/api/bookmarks",
  cloudflareD1ProxyToken: "proxy-token",
};

afterEach(() => vi.unstubAllGlobals());

describe("external backup adapters", () => {
  it("reports only configured targets without exposing secret values", () => {
    expect(getExternalBackupStatus(config)).toEqual({ nutstore: true, cloudflareKv: true, cloudflareD1: true });
    expect(getExternalBackupStatus({ cloudflareApiToken: "token" })).toEqual({ nutstore: false, cloudflareKv: false, cloudflareD1: false });
  });

  it("writes a normalized snapshot to Nutstore and Cloudflare KV using server-side authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const payload = { userId: 7, fileName: "snapshot.json", content: "{\"bookmarks\":[]}", bookmarkCount: 1, createdAt: new Date("2026-08-22T00:00:00.000Z") };
    await saveExternalBackup("nutstore", payload, config);
    await saveExternalBackup("cloudflare_kv", payload, config);
    expect(fetchMock.mock.calls[0][0].toString()).toContain("bookmark-navigation/7/2026-08-22T00-00-00-000Z-snapshot.json");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toMatch(/^Basic /);
    expect(fetchMock.mock.calls[1][0]).toContain("storage/kv/namespaces/namespace-id/values/");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer token");
  });

  it("sends D1 writes only through a configured authenticated proxy", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await saveExternalBackup("cloudflare_d1", { userId: 8, fileName: "backup", content: "{}", bookmarkCount: 3 }, config);
    expect(fetchMock).toHaveBeenCalledWith(config.cloudflareD1ProxyUrl, expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer proxy-token" }) }));
  });
});
