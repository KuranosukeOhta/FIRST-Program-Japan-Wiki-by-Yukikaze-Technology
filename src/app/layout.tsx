import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/JsonLd";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "FIRST Program Japan Wiki",
  description: "FIRSTプログラムに関する情報共有のためのウィキサイトです。FRC、FTC、FLLなどの競技情報やチームビルディング、プログラミング、メカニカル設計などの技術的なリソースを提供しています。",
  metadataBase: new URL("https://first-program-japan-wiki.vercel.app"),
  alternates: {
    canonical: "/",
  },
  keywords: ["FIRST", "ロボティクス", "FRC", "FTC", "FLL", "STEM教育", "競技ロボット", "技術学習", "日本", "FIRST JAPAN", "レゴ", "プログラミング", "メカニカル設計"],
  authors: [{ name: "Yukikaze Technology" }],
  creator: "FIRST Program Japan Wiki運営チーム",
  publisher: "Yukikaze Technology",
  category: "教育,テクノロジー,ロボティクス",
  openGraph: {
    title: "FIRST Program Japan Wiki",
    description: "FIRSTプログラムに関する総合的な情報共有プラットフォーム",
    siteName: "FIRST Program Japan Wiki",
    locale: "ja_JP",
    type: "website",
    url: "https://first-program-japan-wiki.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FIRST Program Japan Wiki - FRC, FTC, FLLなどのFIRSTプログラムに関する情報ポータル",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FIRST Program Japan Wiki",
    description: "FIRSTプログラムに関する情報共有のためのウィキサイトです。",
    images: ["/og-image.png"],
    creator: "@YukikazeTech",
    site: "@YukikazeTech",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "Google Search Console verification code here", // Replace with actual code
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>
        <div className="flex flex-col min-h-screen bg-[rgb(var(--background-rgb))]">
          <Header />
          <main className="flex-grow w-full">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
        <OrganizationJsonLd />
        <WebsiteJsonLd />
      </body>
    </html>
  );
} 