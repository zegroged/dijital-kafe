import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ROOT_DOMAIN } from "@/lib/constants";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";
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
  metadataBase: new URL(`https://${ROOT_DOMAIN}`),
  applicationName: "Dijital Kafe",
  title: {
    default: "Dijital Kafe — Restoran ve Kafeler için QR Menü",
    template: "%s · Dijital Kafe",
  },
  description:
    "Dijital Kafe ile restoran ve kafeniz için QR menü oluşturun: 150 hazır tema, AI fotoğraf canlandırma ve dijital adisyon (hafif POS). Mobil-uyumlu dijital menü.",
  keywords: [
    "dijital kafe",
    "dijital menü",
    "QR menü",
    "karekod menü",
    "restoran menüsü",
    "kafe menüsü",
    "dijital adisyon",
    "adisyon programı",
    "kafe pos",
    "AI fotoğraf canlandırma",
  ],
  authors: [{ name: "Dijital Kafe", url: `https://${ROOT_DOMAIN}` }],
  creator: "Dijital Kafe",
  publisher: "Dijital Kafe",
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "Dijital Kafe",
    locale: "tr_TR",
    title: "Dijital Kafe — Restoran ve Kafeler için QR Menü",
    description:
      "QR menü, 150 hazır tema, AI fotoğraf canlandırma ve dijital adisyon (hafif POS) — hepsi tek panelde. 14 gün ücretsiz.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dijital Kafe — Restoran ve Kafeler için QR Menü",
    description:
      "QR menü, 150 hazır tema, AI fotoğraf canlandırma ve dijital adisyon — 14 gün ücretsiz.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Google Search Console doğrulaması: .env'e GOOGLE_SITE_VERIFICATION=<token>
  // ekleyip yeniden derleyince <meta name="google-site-verification"> basılır.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
