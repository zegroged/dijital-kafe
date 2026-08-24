import {
  APP_NAME,
  PLANS,
  ROOT_DOMAIN,
  TRIAL_DAYS,
  withKdv,
} from "@/lib/constants";
import { COMPANY } from "@/lib/legal";

// ============================================================
// SEO — yapılandırılmış veri (JSON-LD / schema.org)
// Google'ın markayı ("Dijital Kafe") tanıması, bilgi paneli + zengin
// sonuç (rich result) üretmesi için. Tüm URL'ler ROOT_DOMAIN'den türer
// (build-time'da dijitalkafe.com gömülür — sitemap/robots ile aynı kaynak).
// ============================================================

const SITE_URL = `https://${ROOT_DOMAIN}`;

// "05XX XXX XX XX" → "+905XXXXXXXXX" (schema.org telephone E.164 ister)
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  // COMPANY.phone ortam değişkeninden gelir; tanımlı değilse "[TELEFON]" olur ve
  // rakam çıkmaz. O durumda "+90" gibi bozuk bir değer yaymak yerine boş dön.
  if (digits.length < 10) return "";
  return `+90${digits}`;
}

// İşletme/marka kimliği → marka aramasında en güçlü sinyal.
export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: APP_NAME,
  alternateName: ["DijitalKafe", "Dijital Kafe QR Menü", "Dijital Kafe Adisyon"],
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  image: `${SITE_URL}/opengraph-image`,
  email: COMPANY.email,
  telephone: toE164(COMPANY.phone),
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.address,
    addressCountry: "TR",
  },
  areaServed: "TR",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: COMPANY.email,
    telephone: toE164(COMPANY.phone),
    availableLanguage: ["Turkish"],
  },
};

// Site kimliği → Google'ın "site adı" ve sitelink'leri için.
export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: APP_NAME,
  alternateName: "Dijital Kafe QR Menü",
  url: SITE_URL,
  inLanguage: "tr-TR",
  publisher: { "@type": "Organization", name: APP_NAME, url: SITE_URL },
};

// Ürün (SaaS) kimliği → "ücretsiz / fiyat / özellik" zengin sonuçları.
export const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: APP_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  inLanguage: "tr-TR",
  description:
    "Restoran ve kafeler için QR menü, 150 hazır tema, AI fotoğraf canlandırma ve dijital adisyon (hafif POS) sunan bulut tabanlı dijital menü platformu.",
  offers: {
    "@type": "Offer",
    price: String(withKdv(PLANS.premium.priceMonthly)),
    priceCurrency: "TRY",
    description: `${TRIAL_DAYS} gün ücretsiz deneme`,
  },
  featureList: [
    "QR menü",
    "150 hazır tema",
    "AI fotoğraf canlandırma",
    "Dijital adisyon / hafif POS",
    "Otomatik subdomain",
    "Fiziksel QR sipariş",
  ],
};

// SSS → FAQPage zengin sonucu (Google'da açılır soru-cevap).
export function faqPageLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

// JSON-LD'yi <script> olarak basan sunucu bileşeni (Next.js önerisi).
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
