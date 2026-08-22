import { describe, expect, it } from "vitest";
import { createStandaloneNavigation } from "./standalone";

describe("createStandaloneNavigation", () => {
  it("does not embed fixed export credentials in offline navigation files", () => {
    const html = createStandaloneNavigation([], "favicon_im");
    expect(html).not.toContain("123456");
    expect(html).not.toContain("username!=='admin'");
    expect(html).toContain("离线导航无法验证服务器登录会话");
  });
});
