/**
 * 将 Vite 的资源基础路径转换为 Wouter 所需的路由前缀。
 *
 * Vite 使用相对 base（"./"）时，GitHub Pages 会在仓库子路径下提供页面；
 * Wouter 则需要该子路径作为 base，才能将 `/仓库名/` 识别为应用内的 `/`。
 */
export function resolveRouterBase(viteBaseUrl: string, pageUrl: string): string {
  const pathname = new URL(viteBaseUrl, pageUrl).pathname.replace(/\/+$/, "");
  return pathname === "/" ? "" : pathname;
}
