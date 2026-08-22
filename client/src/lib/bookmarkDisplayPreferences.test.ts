import { describe, expect, it } from "vitest";
import { coerceDescriptionLineLimit, resolveDescriptionVisibility } from "./bookmarkDisplayPreferences";

describe("bookmark display preferences", () => {
  it("uses a supported description line count and falls back to two lines", () => {
    expect(coerceDescriptionLineLimit(1)).toBe(1);
    expect(coerceDescriptionLineLimit("4")).toBe(4);
    expect(coerceDescriptionLineLimit(9)).toBe(2);
    expect(coerceDescriptionLineLimit("invalid")).toBe(2);
  });

  it("lets a category override the inherited description visibility", () => {
    const overrides = { "folder-hidden": false, "folder-visible": true };
    expect(resolveDescriptionVisibility("folder-hidden", true, overrides)).toBe(false);
    expect(resolveDescriptionVisibility("folder-visible", false, overrides)).toBe(true);
    expect(resolveDescriptionVisibility("folder-inherit", true, overrides)).toBe(true);
  });
});
