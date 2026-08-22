import { describe, expect, it } from "vitest";
import { resolveRouterBase } from "./routerBase";

describe("resolveRouterBase", () => {
  it("在根路径部署时不添加路由前缀", () => {
    expect(resolveRouterBase("./", "http://localhost:3000/")).toBe("");
  });

  it("将 GitHub Pages 的仓库子路径作为路由前缀", () => {
    expect(resolveRouterBase("./", "https://zhixiaotx.github.io/navgation/")).toBe("/navgation");
  });
});
