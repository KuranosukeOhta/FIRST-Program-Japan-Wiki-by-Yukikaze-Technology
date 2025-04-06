import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "FIRST Program Japan Wiki",
  description: "FIRSTプログラムに関する情報共有のためのウィキサイトです。FRC、FTC、FLLなどの競技情報やチームビルディング、プログラミング、メカニカル設計などの技術的なリソースを提供しています。",
  keywords: ["FIRST", "ロボティクス", "FRC", "FTC", "FLL", "STEM教育", "競技ロボット", "技術学習"],
  authors: [{ name: "ユキカゼテクノロジー" }],
  creator: "FIRST Program Japan Wiki運営チーム",
  publisher: "ユキカゼテクノロジー",
  openGraph: {
    title: "FIRST Program Japan Wiki",
    description: "FIRSTプログラムに関する総合的な情報共有プラットフォーム",
    url: "https://wiki.firstjapan.jp",
    siteName: "FIRST Program Japan Wiki",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIRST Program Japan Wiki",
    description: "FIRSTプログラムに関する情報共有のためのウィキサイトです。",
  },
  robots: {
    index: true,
    follow: true,
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
      </body>
    </html>
  );
} 