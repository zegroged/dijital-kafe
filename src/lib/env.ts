import { z } from "zod";

// Sunucu tarafı ortam değişkenleri.
// ÖNEMLİ: Entegrasyon anahtarları (AR Code, Bunny, Resend) OPSİYONEL —
// uygulama bunlar girilmeden de çalışır. Böylece zemini kurup AR Code'u
// sonra ekleyebiliyoruz.
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // --- Zorunlu çekirdek ---
  DATABASE_URL: z.string().min(1, "DATABASE_URL gerekli"),
  REDIS_URL: z.string().min(1, "REDIS_URL gerekli"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET en az 16 karakter olmalı"),

  // --- Public ---
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default("to-p1.com"),
  NEXT_PUBLIC_APP_URL: z.string().optional(),

  // --- E-posta (Resend) — opsiyonel ---
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // --- E-posta (SMTP — Google Workspace vb.) — opsiyonel ---
  // Şifre sıfırlama maili buradan gider. Google: smtp.gmail.com:587 + app password.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // --- Depolama (BunnyCDN) — opsiyonel ---
  BUNNY_STORAGE_ZONE: z.string().optional(),
  BUNNY_STORAGE_ACCESS_KEY: z.string().optional(),
  BUNNY_STORAGE_HOST: z.string().optional(), // örn. storage.bunnycdn.com
  BUNNY_CDN_URL: z.string().optional(), // örn. https://p1.b-cdn.net

  // --- AR Code (3D/AR) — opsiyonel, sonradan eklenecek ---
  // "stub": entegrasyon yok | "mock": örnek modelle test | "live": gerçek API
  ARCODE_PROVIDER: z.enum(["stub", "mock", "live"]).default("stub"),
  ARCODE_API_KEY: z.string().optional(),
  ARCODE_API_BASE: z.string().optional(),
  ARCODE_WEBHOOK_SECRET: z.string().optional(),

  // --- Nano Banana (Gemini görsel canlandırma) — opsiyonel, sonradan eklenecek ---
  // "stub": yok | "mock": sharp ile gerçek renk canlandırma (key'siz test) | "live": Gemini
  NANOBANANA_PROVIDER: z.enum(["stub", "mock", "live"]).default("stub"),
  NANOBANANA_API_KEY: z.string().optional(),
  NANOBANANA_MODEL: z.string().default("gemini-2.5-flash-image"),

  // Servisler arası iç çağrılar (cron, webhook) için
  INTERNAL_API_KEY: z.string().optional(),

  // --- Özel sohbet (2 kişilik) ---
  // Virgülle ayrılmış KULLANICI ID'si (profiles.id UUID) — tam 2 adet.
  // E-posta/telefon YAZMA: o alanlar sahiplenilebilir (bkz. lib/chat/access.ts).
  // Boşsa/tek kişiyse özellik tamamen kapalıdır (herkese 404).
  CHAT_MEMBER_IDS: z.string().optional(),

  // Ödeme altyapısı gelene kadar: "true" ise kayıtta seçilen paket (basic/premium)
  // ÖDEMESİZ + süresiz aktif olarak açılır. Ödeme bağlanınca "false" yap.
  OPEN_MEMBERSHIP: z.string().optional(),

  // --- Ödeme (İyzico) ---
  // "stub": ödeme kapalı | "mock": anında başarılı (test) | "live": gerçek İyzico
  PAYMENT_PROVIDER: z.enum(["stub", "mock", "live"]).default("stub"),
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  // Sandbox: https://sandbox-api.iyzipay.com | Canlı: https://api.iyzipay.com
  IYZICO_BASE_URL: z.string().optional(),

  // --- Komisyoncu çekim ödemesi (payout) ---
  // "manual": admin onaylar + toplu banka/Papara CSV ile elle gönderir (varsayılan)
  // "mock":   anında ödendi (test akışı)
  // "papara": Papara Business toplu ödeme API'si (key gerekir)
  PAYOUT_PROVIDER: z.enum(["manual", "mock", "papara"]).default("manual"),
  PAPARA_API_KEY: z.string().optional(),
  PAPARA_API_BASE: z.string().optional(), // örn. https://merchant-api.papara.com
  // Gerçek kişi komisyon stopaj oranı (override). Boşsa DEFAULT_WITHHOLDING_RATE.
  WITHHOLDING_RATE: z.coerce.number().min(0).max(1).optional(),
});

function parseEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Geçersiz ortam değişkenleri:\n",
      z.prettifyError(parsed.error),
    );
    throw new Error(
      "Ortam değişkenleri doğrulanamadı. .env dosyanı kontrol et.",
    );
  }
  return parsed.data;
}

export const env = parseEnv();

// Hangi entegrasyonlar kullanıma hazır?
export const integrations = {
  resend: () => Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  // SMTP ile mail gönderimi hazır mı? (şifre sıfırlama maili)
  smtp: () =>
    Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM),
  // CDN URL de ZORUNLU: yoksa putToBunny host'suz ("/dishes/x.webp") URL üretir
  // ve görseller kırık görünür. Eksikse yerel /uploads'a düşülür (nginx servis eder).
  bunny: () =>
    Boolean(
      env.BUNNY_STORAGE_ZONE &&
        env.BUNNY_STORAGE_ACCESS_KEY &&
        env.BUNNY_CDN_URL,
    ),
  arcode: () =>
    env.ARCODE_PROVIDER === "live"
      ? Boolean(env.ARCODE_API_KEY)
      : env.ARCODE_PROVIDER !== "stub",
  nanobanana: () =>
    env.NANOBANANA_PROVIDER === "live"
      ? Boolean(env.NANOBANANA_API_KEY)
      : env.NANOBANANA_PROVIDER !== "stub",
  payment: () =>
    env.PAYMENT_PROVIDER === "live"
      ? Boolean(env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY)
      : env.PAYMENT_PROVIDER !== "stub",
  // Payout her zaman "açık": en kötü ihtimalle manual (admin elle gönderir).
  payout: () =>
    env.PAYOUT_PROVIDER === "papara"
      ? Boolean(env.PAPARA_API_KEY)
      : true,
};
