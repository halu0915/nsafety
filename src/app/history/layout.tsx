import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/history",
  "巡檢紀錄",
  "查看歷史巡檢紀錄：巡檢時間、照片與違規數量、風險分數與摘要。",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
