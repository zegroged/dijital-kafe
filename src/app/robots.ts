import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@/lib/constants";

// /robots.txt (origin). Not: Cloudflare "Managed robots.txt" açıksa kenar
// tarafında kendi sürümünü servis edebilir; bu origin sürümü yedektir.
// Genel sayfalar (landing, kayıt, giriş, yasal) taranır; tüm rol panelleri,
// API ve auth yardımcı sayfaları indekslemeye kapalı (ince/özel içerik).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/panel",
        "/admin",
        "/uretici",
        "/komisyoncu",
        "/komisyon-yonetim",
        "/muhasebe",
        "/adisyon",
        "/onboarding",
        "/api",
        "/sifremi-unuttum",
        "/sifre-sifirla",
      ],
    },
    sitemap: `https://${ROOT_DOMAIN}/sitemap.xml`,
  };
}
