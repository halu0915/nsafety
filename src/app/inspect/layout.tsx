import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/inspect",
  "拍照巡檢",
  "上傳工地照片，AI 自動辨識安全隱患，引用具體法條，評估風險等級。",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
