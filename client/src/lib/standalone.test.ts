import { describe, expect, it } from "vitest";
import { createStandaloneNavigation } from "./standalone";

describe("createStandaloneNavigation", () => {
  it("protects offline data-tool exports with the requested local credentials", () => {
    const html = createStandaloneNavigation([], "favicon_im");
    expect(html).toContain("username!=='admin'");
    expect(html).toContain("password!=='123456'");
    expect(html).toContain('alt="书签导航 Logo"');
    expect(html).toContain("https://files.manuscdn.com/user_upload_by_module/session_file/310519663851357957/OzuMJILatIqewIbC.jpg");
  });
});
