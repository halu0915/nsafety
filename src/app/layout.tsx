import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N+Safety AI 工安助手",
  description: "以台灣職業安全衛生法規為依據的 AI 工安巡檢助手。現場檢查、法規查詢、巡檢紀錄，一次完成。",
  metadataBase: new URL("https://safety.nplusstar.ai"),
  openGraph: {
    title: "N+Safety AI 工安助手",
    description: "以台灣職業安全衛生法規為依據的 AI 工安巡檢助手。現場檢查、法規查詢、巡檢紀錄，一次完成。",
    url: "/",
    siteName: "N+Star 恩加斯達國際",
    locale: "zh_TW",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
