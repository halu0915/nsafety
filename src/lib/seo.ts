import type { Metadata } from "next";

export const SITE_URL = "https://safety.nplusstar.ai";
export const SITE_TITLE = "N+Safety AI 工安助手";
export const SITE_DESCRIPTION =
  "以台灣職業安全衛生法規為依據的 AI 工安巡檢助手。現場檢查、法規查詢、巡檢紀錄，一次完成。";

/** 對外公開、要給搜尋引擎收錄的頁面 */
export const PUBLIC_PATHS = ["/", "/inspect", "/checklist", "/regulations", "/history"] as const;

export const openGraphBase = {
  siteName: "N+Star 恩加斯達國際",
  locale: "zh_TW",
  type: "website",
  images: [{ url: "/og.png", width: 1200, height: 630 }],
} satisfies Metadata["openGraph"];

/** 單頁 metadata：自己的標題、描述、canonical 與分享預覽 */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  const fullTitle = path === "/" ? SITE_TITLE : `${title}｜${SITE_TITLE}`;
  return {
    title: path === "/" ? { absolute: SITE_TITLE } : title,
    description,
    alternates: { canonical: path },
    openGraph: { ...openGraphBase, title: fullTitle, description, url: path },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/og.png"] },
  };
}
