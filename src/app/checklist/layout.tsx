import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/checklist",
  "智慧巡檢表",
  "依工程類型自動生成檢查表，逐項勾選拍照，產出合規巡檢報告。",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
