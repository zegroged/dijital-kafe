// Uygulama geneli sabitler. (Client + server'da güvenle import edilebilir.)

export const APP_NAME = "Dijital Kafe";

// Menü subdomain'lerinin kök domaini. Local'de NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
export const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "to-p1.com";

export const TRIAL_DAYS = 14;

// Subdomain olarak alınamayacak adlar.
export const RESERVED_SLUGS = new Set<string>([
  "www",
  "api",
  "admin",
  "app",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "mail",
  "ftp",
  "menu",
  "test",
  "dev",
  "staging",
  "blog",
  "help",
  "support",
  "status",
  "login",
  "register",
  "signup",
  "signin",
  "auth",
  "public",
  "onboarding",
  "billing",
  "settings",
  "komisyoncu",
  "komisyon-yonetim",
  "muhasebe",
  "uretici",
  "adisyon",
  // NOT: "sohbet" bilinçli olarak BURADA DEĞİL — bu liste client paketine
  // giriyor ve gizli /sohbet rotasının varlığını sızdırırdı. Alt alan adı
  // (sohbet.<domain>) ile /sohbet yolu farklı ad alanları, çakışma yok.
  "sifremi-unuttum",
  "sifre-sifirla",
  "to-p1",
  // Yeni domain (dijitalkafe.com) geçişi için rezerve.
  "dijitalkafe",
  "dijital-kafe",
]);

export type PlanKey = "free_trial" | "basic" | "premium";

export interface PlanLimits {
  key: PlanKey;
  label: string;
  priceMonthly: number; // TRY (0 = ücretsiz)
  maxDishes: number; // -1 = sınırsız
  maxCategories: number; // -1 = sınırsız
  model3dQuota: number; // aylık 3D model hakkı (şimdilik vitrinde değil, dormant)
  aiEnhanceQuota: number; // aylık AI fotoğraf canlandırma hakkı — paketlerin ANA farkı
}

// Paketlerin ana farkı: AI fotoğraf canlandırma (Nano Banana) aylık kotası.
// Gerçek maliyetli kaldıraç bu. Kategori/ürün/tema/QR her pakette SINIRSIZ.
// (3D kotası kodda kalıyor ama vitrinde değil — sonradan AR Code ile.)
export const PLANS: Record<PlanKey, PlanLimits> = {
  free_trial: {
    key: "free_trial",
    label: "14 Gün Ücretsiz Deneme",
    priceMonthly: 0,
    maxDishes: -1,
    maxCategories: -1,
    model3dQuota: 50,
    // Deneme TAM ERİŞİM: kısıtlama yok, AI dahil.
    aiEnhanceQuota: 100,
  },
  // (legacy) Basic kaldırıldı — yeni kayıtlarda sunulmaz; eski aboneler için durur.
  basic: {
    key: "basic",
    label: "Basic (eski)",
    priceMonthly: 499,
    maxDishes: -1,
    maxCategories: -1,
    model3dQuota: 20,
    aiEnhanceQuota: 30,
  },
  premium: {
    key: "premium",
    label: "Tam Erişim",
    priceMonthly: 1500, // KDV HARİÇ net. Tahsil edilen = withKdv(net).
    maxDishes: -1,
    maxCategories: -1,
    model3dQuota: 50,
    aiEnhanceQuota: 100,
  },
};

// Tek ücretli plan (deneme bitince buna geçilir).
export const PAID_PLAN: PlanKey = "premium";

// KDV oranı (%20). Plan fiyatları NET tutulur; müşteriden withKdv(net) tahsil edilir.
export const KDV_RATE = 0.2;
export const withKdv = (net: number) => Math.round(net * (1 + KDV_RATE));

export const isUnlimited = (n: number) => n < 0;

// --- Çok aktörlü platform ---
// QR fiziksel ürün satışından platform payı (%10). Kalanı üreticiye.
export const QR_PLATFORM_FEE_RATE = 0.1;

// Komisyoncu kazanç modelleri (admin hesabı oluştururken seçer):
//   one_time  → ilk paket ödemesinden BİR KEZ %70
//   recurring → müşteri aboneliğini sürdürdükçe HER ödemeden %30
export type CommissionType = "one_time" | "recurring";
export const AFFILIATE_RATE_ONE_TIME = 0.7;
export const AFFILIATE_RATE_RECURRING = 0.3;
export const COMMISSION_RATE_BY_TYPE: Record<CommissionType, number> = {
  one_time: AFFILIATE_RATE_ONE_TIME,
  recurring: AFFILIATE_RATE_RECURRING,
};
export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  one_time: "Tek seferlik %70",
  recurring: "Devam eden %30",
};

// --- Çekim (withdrawal) + stopaj ---
// Minimum çekim tutarı (TRY). Bunun altında talep açılamaz.
export const MIN_WITHDRAWAL_TRY = 500;

// Stopaj oranı varsayılanı. DİKKAT: gerçek kişi komisyona uygulanan baskın oran
// ~%20'dir (%15 DEĞİL — o bahis/kâr payı içindir). Kesin oran/yapı için MALİ
// MÜŞAVİR onayı şarttır. Oran env.WITHHOLDING_RATE ile override edilir ve her
// çekim talebinde snapshot'lanır (geçmiş talepler sabit kalır).
export const DEFAULT_WITHHOLDING_RATE = 0.2;

export type TaxStatus = "individual_no_tax" | "tax_registered";
export const TAX_STATUS_LABELS: Record<TaxStatus, string> = {
  individual_no_tax: "Vergi mükellefi değilim (stopaj kesilsin)",
  tax_registered: "Vergi mükellefiyim (belge yükleyeceğim)",
};

export type WithdrawalStatus =
  | "requested"
  | "approved"
  | "processing"
  | "paid"
  | "rejected";
export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  requested: "Onay bekliyor",
  approved: "Onaylandı",
  processing: "Gönderiliyor",
  paid: "Ödendi",
  rejected: "Reddedildi",
};

export type Role =
  | "owner"
  | "admin"
  | "qr_vendor"
  | "affiliate"
  | "affiliate_manager"
  | "accountant"
  | "staff";

// Giriş sonrası / yanlış panele giren kullanıcı rolüne göre buraya gider.
export function landingPathForRole(role: string | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "qr_vendor":
      return "/uretici";
    case "affiliate":
      return "/komisyoncu";
    case "affiliate_manager":
      return "/komisyon-yonetim";
    case "accountant":
      return "/muhasebe";
    case "staff":
      return "/adisyon";
    default:
      return "/panel";
  }
}
