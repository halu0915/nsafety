import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/history",
  "巡檢紀錄",
  "查看歷史巡檢報告、違規趨勢分析、改善追蹤。",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
