import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/checklist",
  "智慧巡檢表",
  "依工程類型帶出巡檢檢查表，逐項勾選結果並加註，匯出巡檢報告。",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
