import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "/regulations",
  "工安法規問答",
  "輸入情境或關鍵字，即時查詢職安法規條文，含罰則金額提示。",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
