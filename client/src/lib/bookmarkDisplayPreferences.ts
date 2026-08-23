export type CardDensity = "compact" | "spacious";
export type DescriptionLineLimit = 1 | 2 | 3 | 4;

export function coerceDescriptionLineLimit(value: unknown): DescriptionLineLimit {
  const parsed = Number(value);
  return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 ? parsed : 2;
}

export function resolveDescriptionVisibility(folderId: string, inherited: boolean, overrides: Record<string, boolean>): boolean {
  return Object.prototype.hasOwnProperty.call(overrides, folderId) ? overrides[folderId] : inherited;
}
