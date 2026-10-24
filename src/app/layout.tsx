import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { openGraphBase, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: `%s｜${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: { ...openGraphBase, title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

const ORG_ID = "https://nplusstar.ai/#organization";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "N+Star 恩加斯達國際",
      alternateName: "N+Star International Co., Ltd.",
      url: "https://nplusstar.ai",
      logo: `${SITE_URL}/logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_TITLE,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "zh-TW",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_TITLE,
      url: SITE_URL,
      description:
        "以台灣職安法規為核心，拍照辨識工地安全隱患、智慧巡檢表、法規即時查詢。降低罰款風險，守護工人安全。",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "zh-TW",
      featureList: ["拍照辨識", "智慧巡檢表", "法規查詢", "巡檢紀錄"],
      publisher: { "@id": ORG_ID },
      offers: [
        { name: "基礎版", price: 1990 },
        { name: "專業版", price: 4990 },
      ].map(({ name, price }) => ({
        "@type": "Offer",
        name,
        price,
        priceCurrency: "TWD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price,
          priceCurrency: "TWD",
          unitCode: "MON",
        },
      })),
    },
  ],
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
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
