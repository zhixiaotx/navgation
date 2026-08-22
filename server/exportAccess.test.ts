import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("exportAccess.authorize", () => {
  it("authorizes a signed-in user through the protected session procedure", async () => {
    const caller = appRouter.createCaller(createContext({
      id: 42,
      openId: "export-user",
      email: "export@example.com",
      name: "Export User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.exportAccess.authorize()).resolves.toEqual({ authorized: true, userId: 42 });
  });

  it("rejects an export authorization request without a signed-in user", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.exportAccess.authorize()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
