import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@/lib/constants";
import { LEGAL_INDEX } from "@/lib/legal";

// /sitemap.xml — ana pazarlama sitesi + yasal/bilgi sayfaları.
// (Müşteri menüleri kendi subdomain'lerinde; buraya dahil değil.)
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${ROOT_DOMAIN}`;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/kayit`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/giris`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...LEGAL_INDEX.map((d) => ({
      url: `${base}/yasal/${d.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
