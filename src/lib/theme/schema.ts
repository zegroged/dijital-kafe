import { z } from "zod";

// ============================================================
// theme_settings — menü görünümünü belirleyen JSON yapısı.
// menus.theme_settings sütununda saklanır. Customizer bunu düzenler;
// public menü sayfası bundan CSS değişkenleri üretir.
// ============================================================

const hex = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Geçersiz renk kodu");
const radius = z.enum(["none", "sm", "md", "lg"]);
const shadow = z.enum(["none", "sm", "md", "lg"]);

// GÜVENLİK: font adı ve arka plan değeri public menüde CSS'e enjekte edildiği
// için kısıtlanır (CSS injection / harici kaynak yükleme — SSRF/exfil — engeli).
const fontName = z.string().regex(/^[A-Za-z0-9 ]{1,40}$/, "Geçersiz font");
const HEX6 = /^#([0-9a-fA-F]{6})$/;
// Arka plan görseli sadece Bunny CDN veya yerel /uploads; tırnak/parantez yasak.
const BG_IMAGE_RE =
  /^(https:\/\/[a-z0-9.-]+\.b-cdn\.net|\/uploads)\/[^\s"'()\\]+$/i;
// Gradyan: yalnız linear/radial-gradient(...), url()/declaration kaçışı imkânsız.
const BG_GRADIENT_RE = /^(?:linear|radial)-gradient\([a-zA-Z0-9#%.,\s-]+\)$/;

export const themeSchema = z.object({
  template: z
    .enum(["klasik", "modern", "minimal", "kartli", "elegant"])
    .default("modern"),
  colors: z
    .object({
      primary: hex.default("#FF6B35"),
      secondary: hex.default("#2E2E2E"),
      background: hex.default("#FAFAFA"),
      text: hex.default("#1A1A1A"),
      accent: hex.default("#FF6B35"),
      card_bg: hex.default("#FFFFFF"),
    })
    .prefault({}),
  font: z
    .object({
      heading: fontName.default("Playfair Display"),
      body: fontName.default("Inter"),
      scale: z.enum(["sm", "md", "lg", "xl"]).default("md"),
    })
    .prefault({}),
  card_style: z
    .object({
      border_radius: radius.default("md"),
      shadow: shadow.default("sm"),
      layout: z.enum(["grid", "list"]).default("grid"),
      // Kart kenar efekti: yok / ince çizgi / altın aksan çizgi / iç çerçeve.
      border: z.enum(["none", "hairline", "accent", "inset"]).default("none"),
    })
    .prefault({}),
  background: z
    .object({
      type: z.enum(["solid", "gradient", "image"]).default("solid"),
      value: z.string().default("#FAFAFA"),
    })
    .prefault({}),
  button_style: z
    .object({
      border_radius: radius.default("md"),
      variant: z.enum(["filled", "outline", "ghost"]).default("filled"),
    })
    .prefault({}),
  // Arka plan efekti (afilli his): yok / ışıltı / ince çerçeve.
  decor: z.enum(["none", "glow", "frame"]).default("none"),
}).superRefine((t, ctx) => {
  // Arka plan değerini tipine göre doğrula (CSS injection'a karşı yazma kapısı).
  const b = t.background;
  const bad = (message: string) =>
    ctx.addIssue({ code: "custom", message, path: ["background", "value"] });
  if (b.type === "solid" && !HEX6.test(b.value)) bad("Geçersiz arka plan rengi");
  if (
    b.type === "image" &&
    (/["'()\\]/.test(b.value) || !BG_IMAGE_RE.test(b.value))
  ) {
    bad("Geçersiz arka plan görseli");
  }
  if (b.type === "gradient" && !BG_GRADIENT_RE.test(b.value)) {
    bad("Geçersiz gradyan");
  }
});

export type ThemeSettings = z.infer<typeof themeSchema>;

// Tüm varsayılanlarla dolu tema.
export const DEFAULT_THEME: ThemeSettings = themeSchema.parse({});

// Eksik/bozuk JSON'u güvenle tam temaya tamamlar. Parse başarısızsa (bozuk/
// kötü niyetli kayıt) public menüyü çökertmek yerine varsayılana düşer.
export function parseTheme(input: unknown): ThemeSettings {
  const result = themeSchema.safeParse(input ?? {});
  return result.success ? result.data : DEFAULT_THEME;
}

// --- Customizer için hazır seçenekler ---

// Tonlamalı, birbiriyle uyumlu hazır paletler (primary / secondary / background).
export const PALETTES = [
  { name: "Sıcak Turuncu", primary: "#FF6B35", secondary: "#9A3412", background: "#FFF8F0" },
  { name: "Espresso", primary: "#6F4E37", secondary: "#3E2723", background: "#FBF6F0" },
  { name: "Latte Krem", primary: "#A47551", secondary: "#5C4433", background: "#FAF4EC" },
  { name: "Koyu Altın", primary: "#D4AF37", secondary: "#8A6D1A", background: "#0F0F0F" },
  { name: "Bordo Şarap", primary: "#7B2D26", secondary: "#A4453C", background: "#FBF3F2" },
  { name: "Mercan", primary: "#FF7F6B", secondary: "#C44536", background: "#FFF6F3" },
  { name: "Hardal", primary: "#C99700", secondary: "#6B4F1D", background: "#FCF8EE" },
  { name: "Orman Yeşili", primary: "#2D6A4F", secondary: "#1B4332", background: "#F0F7F4" },
  { name: "Adaçayı", primary: "#6B8E5A", secondary: "#3F5232", background: "#F4F7F0" },
  { name: "Okyanus", primary: "#0077B6", secondary: "#023E8A", background: "#F0F8FF" },
  { name: "Teal", primary: "#2A9D8F", secondary: "#264653", background: "#F0F7F6" },
  { name: "Lavanta", primary: "#7B2CBF", secondary: "#5A189A", background: "#F8F4FF" },
  { name: "Gül Pudra", primary: "#D6336C", secondary: "#862E51", background: "#FFF5F8" },
  { name: "Antrasit", primary: "#3B82F6", secondary: "#1E293B", background: "#F2F4F8" },
  { name: "Şeftali", primary: "#FF9F7A", secondary: "#C2410C", background: "#FFF4EE" },
  { name: "Nane", primary: "#14B8A6", secondary: "#0F766E", background: "#EFFCF8" },
  { name: "Gece Mavisi", primary: "#2563EB", secondary: "#1E293B", background: "#F1F5FB" },
  { name: "Kömür", primary: "#A1A1AA", secondary: "#3F3F46", background: "#18181B" },
  { name: "Bal", primary: "#E0A82E", secondary: "#92400E", background: "#FDF9EF" },
  { name: "Fıstık", primary: "#65A30D", secondary: "#3F6212", background: "#F7FCEE" },
  { name: "Gül Altın", primary: "#C9A27A", secondary: "#9C6B4A", background: "#FBF5F0" },
  { name: "Buz Mavisi", primary: "#38BDF8", secondary: "#0369A1", background: "#F0F9FF" },
  { name: "Toprak", primary: "#B07D34", secondary: "#6B4F1D", background: "#FBF5E9" },
  { name: "Zümrüt", primary: "#0E7C5A", secondary: "#0A5740", background: "#EFFAF5" },
  { name: "Gün Batımı", primary: "#FF7E5F", secondary: "#C2410C", background: "#FFF4EE" },
  { name: "Ametist", primary: "#9B59B6", secondary: "#6C3483", background: "#F8F4FB" },
  { name: "Bakır", primary: "#B87333", secondary: "#7A4A1E", background: "#FBF4EC" },
  { name: "Çelik Mavi", primary: "#4682B4", secondary: "#2E5A7E", background: "#F1F6FA" },
  { name: "Yosun", primary: "#6B8E5A", secondary: "#445021", background: "#F5F7F0" },
  { name: "Kiraz", primary: "#C8102E", secondary: "#7A0A1C", background: "#FFF4F4" },
  { name: "Tropik", primary: "#15BFA6", secondary: "#0F766E", background: "#EFFCFA" },
  { name: "Karamel", primary: "#C98A3C", secondary: "#8A5A1E", background: "#FCF6EC" },
  { name: "Pembe Altın", primary: "#D6A4A4", secondary: "#A8707A", background: "#FBF4F2" },
  { name: "Limon", primary: "#B59B00", secondary: "#7A6500", background: "#FCFBEC" },
  { name: "Gece Yarısı", primary: "#3B82F6", secondary: "#94A3B8", background: "#0F172A" },
  { name: "Minimal Siyah", primary: "#1A1A1A", secondary: "#525252", background: "#FFFFFF" },
] as const;

// Font kombinasyonları. Hepsi 400 + 700 ağırlığına sahip (Google Fonts isteği
// reddetmesin diye — bkz. googleFontsHref).
export const FONT_PAIRS = [
  { name: "Klasik", heading: "Playfair Display", body: "Inter" },
  { name: "Modern", heading: "Outfit", body: "DM Sans" },
  { name: "Cesur", heading: "Oswald", body: "Roboto" },
  { name: "Zarif", heading: "Cormorant Garamond", body: "Lato" },
  { name: "Editöryel", heading: "Lora", body: "Nunito Sans" },
  { name: "Sıcak", heading: "Poppins", body: "Open Sans" },
  { name: "Zarif Serif", heading: "Libre Baskerville", body: "Montserrat" },
  { name: "Sade", heading: "Inter", body: "Inter" },
] as const;

export const TEMPLATES = [
  { key: "klasik", label: "Klasik" },
  { key: "modern", label: "Modern" },
  { key: "minimal", label: "Minimal" },
  { key: "kartli", label: "Kartlı" },
  { key: "elegant", label: "Elegant" },
] as const;

// --- HAZIR GÖRSEL ŞABLONLAR ---
// Her biri eksiksiz, profesyonel bir görünüm. Müşteri tek tıkla uygular.
export type ThemePreset = {
  key: string;
  name: string;
  desc: string;
  theme: ThemeSettings;
};

// Kompakt preset kurucu. pr/se/bg/tx/cd = renkler, h/b = fontlar, g = gradyan bitişi.
type PI = {
  t?: ThemeSettings["template"];
  pr: string;
  se: string;
  bg: string;
  tx: string;
  cd: string;
  ac?: string;
  h: string;
  b: string;
  sc?: ThemeSettings["font"]["scale"];
  rd?: "none" | "sm" | "md" | "lg";
  sh?: "none" | "sm" | "md" | "lg";
  ly?: "grid" | "list";
  br?: "none" | "sm" | "md" | "lg";
  bv?: "filled" | "outline" | "ghost";
  g?: string;
  bd?: "none" | "hairline" | "accent" | "inset"; // kart kenar efekti
  dc?: "none" | "glow" | "frame"; // arka plan efekti
};
function P(key: string, name: string, desc: string, i: PI): ThemePreset {
  return {
    key,
    name,
    desc,
    theme: themeSchema.parse({
      template: i.t ?? "modern",
      colors: { primary: i.pr, secondary: i.se, background: i.bg, text: i.tx, accent: i.ac ?? i.pr, card_bg: i.cd },
      font: { heading: i.h, body: i.b, scale: i.sc ?? "md" },
      card_style: { border_radius: i.rd ?? "md", shadow: i.sh ?? "sm", layout: i.ly ?? "grid", border: i.bd ?? "none" },
      button_style: { border_radius: i.br ?? i.rd ?? "md", variant: i.bv ?? "filled" },
      background: i.g
        ? { type: "gradient", value: `linear-gradient(160deg, ${i.bg}, ${i.g})` }
        : { type: "solid", value: i.bg },
      decor: i.dc ?? "none",
    }),
  };
}

// 50+ gerçek sektör-ilhamlı hazır şablon (kafe, restoran, tatlı, ızgara, bar...).
export const THEME_PRESETS: ThemePreset[] = [
  // — Kafe & Kahve —
  P("modern-kafe", "Modern Kafe", "Sıcak turuncu, yuvarlak kartlar", { pr: "#FF6B35", se: "#9A3412", bg: "#FFF8F0", tx: "#2A1A12", cd: "#FFFFFF", h: "Outfit", b: "DM Sans", rd: "lg", sh: "md" }),
  P("espresso", "Espresso Bar", "Koyu kahve, güçlü duruş", { pr: "#6F4E37", se: "#3E2723", bg: "#FBF6F0", tx: "#2C1C12", cd: "#FFFFFF", h: "Oswald", b: "Roboto", rd: "sm" }),
  P("latte", "Latte", "Sütlü krem tonlar", { pr: "#A47551", se: "#5C4433", bg: "#FAF4EC", tx: "#3E2C1E", cd: "#FFFDF9", ac: "#C08552", h: "Cormorant Garamond", b: "Lato", sc: "lg" }),
  P("koy-kahvesi", "Köy Kahvesi", "Toprak tonları, rustik", { pr: "#B45309", se: "#7C2D12", bg: "#FAF3E8", tx: "#3B2412", cd: "#FFFDF7", h: "Lora", b: "Nunito Sans" }),
  P("specialty", "Üçüncü Dalga", "Minimal, specialty", { pr: "#2B2B2B", se: "#6B6B6B", bg: "#F5F4F2", tx: "#1A1A1A", cd: "#FFFFFF", h: "Space Grotesk", b: "Inter", rd: "sm" }),
  P("kahve-kitap", "Kahve & Kitap", "Sıcak, edebi", { pr: "#8B5E3C", se: "#4A2F1A", bg: "#F7F1E7", tx: "#33241A", cd: "#FFFFFF", h: "Libre Baskerville", b: "Montserrat" }),
  P("vintage-kafe", "Vintage Kafe", "Sepya, nostaljik", { pr: "#B08968", se: "#7F5539", bg: "#F3EBDD", tx: "#3A2D1F", cd: "#FBF6EC", h: "Playfair Display", b: "Lato" }),
  // — Fine Dining & Restoran —
  P("sik-restoran", "Şık Restoran", "Koyu, altın, zarif", { t: "elegant", pr: "#D4AF37", se: "#B8941F", bg: "#121212", tx: "#F3ECDD", cd: "#1C1C1C", h: "Playfair Display", b: "Inter", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#0D0D0D" }),
  P("luks-aksam", "Lüks Akşam", "Siyah & şampanya", { t: "elegant", pr: "#C5A572", se: "#8C6D3F", bg: "#161310", tx: "#EDE6D8", cd: "#211D18", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#0C0A08" }),
  P("fransiz-bistro", "Fransız Bistro", "Bordo & krem", { t: "klasik", pr: "#7B2D26", se: "#A4453C", bg: "#FBF4EF", tx: "#3A211C", cd: "#FFFFFF", h: "EB Garamond", b: "Lato", sc: "lg", rd: "sm" }),
  P("italyan", "İtalyan Trattoria", "Yeşil, kırmızı, krem", { t: "klasik", pr: "#2F6F4E", se: "#B91C1C", bg: "#FAF6EC", tx: "#2B2A22", cd: "#FFFFFF", ac: "#B91C1C", h: "Lora", b: "Nunito Sans" }),
  P("akdeniz", "Akdeniz", "Turkuaz & kum", { pr: "#2A9D8F", se: "#1F6F66", bg: "#F3F8F6", tx: "#1E332F", cd: "#FFFFFF", ac: "#E9C46A", h: "Outfit", b: "Open Sans" }),
  P("royal", "Royal", "Lacivert & altın", { t: "elegant", pr: "#C9A24A", se: "#1E2A52", bg: "#0F1426", tx: "#EDE8DA", cd: "#171E36", h: "Cinzel", b: "Lato", sc: "lg", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#0A0E1C" }),
  P("mermer", "Mermer", "Beyaz, gri, altın", { pr: "#A88B4C", se: "#6B6B6B", bg: "#F4F2EE", tx: "#2A2A2A", cd: "#FFFFFF", h: "Cormorant Garamond", b: "Inter", sc: "lg", rd: "sm" }),
  // — Izgara & Et —
  P("steakhouse", "Steakhouse", "Kömür & kırmızı", { pr: "#E63946", se: "#B02A37", bg: "#1A1714", tx: "#F0E6DD", cd: "#262019", h: "Oswald", b: "Roboto", rd: "sm", sh: "lg", ly: "list", br: "none", g: "#14110E" }),
  P("ocakbasi", "Ocakbaşı", "Ateş tonları, koyu", { pr: "#F97316", se: "#C2410C", bg: "#1C1815", tx: "#F2E9DF", cd: "#2A2420", h: "Oswald", b: "Roboto", rd: "sm", sh: "md", ly: "list", g: "#120F0D" }),
  P("bbq", "BBQ", "Dumanlı kahve & turuncu", { pr: "#D2691E", se: "#7C3A12", bg: "#211A14", tx: "#F0E4D6", cd: "#2E251D", h: "Archivo", b: "Roboto", sh: "md", ly: "list", g: "#171210" }),
  P("et-lokantasi", "Et Lokantası", "Koyu kırmızı, klasik", { t: "klasik", pr: "#9B2226", se: "#5C161A", bg: "#FBF3F2", tx: "#33191A", cd: "#FFFFFF", h: "Merriweather", b: "Lato", rd: "sm" }),
  // — Pizza & İtalyan —
  P("pizzeria", "Pizzeria", "Kırmızı, yeşil, krem", { pr: "#C8102E", se: "#1E6F3C", bg: "#FCF7EE", tx: "#2A2620", cd: "#FFFFFF", ac: "#1E6F3C", h: "Poppins", b: "Open Sans" }),
  P("napoli", "Napoli", "Domates & fesleğen", { t: "klasik", pr: "#D62828", se: "#2E7D32", bg: "#FAF6EC", tx: "#2B2620", cd: "#FFFFFF", h: "Lora", b: "Lato" }),
  // — Burger & Fast Food —
  P("burger-house", "Burger House", "Kırmızı & sarı, enerjik", { pr: "#E11D2A", se: "#B91017", bg: "#FFF7E8", tx: "#241712", cd: "#FFFFFF", ac: "#F4A300", h: "Archivo", b: "Work Sans", rd: "lg", sh: "md" }),
  P("diner", "Amerikan Diner", "Retro kırmızı & turkuaz", { pr: "#D7263D", se: "#0FA3A3", bg: "#FBF6EF", tx: "#26201B", cd: "#FFFFFF", ac: "#0FA3A3", h: "Oswald", b: "Roboto", sh: "md" }),
  P("sokak-lezzeti", "Sokak Lezzeti", "Canlı turuncu, modern", { pr: "#FB7113", se: "#C2410C", bg: "#15120F", tx: "#F4EBE2", cd: "#221D18", h: "Space Grotesk", b: "Inter", sh: "md", ly: "list", g: "#100D0B" }),
  // — Tatlı & Pastane —
  P("pastane", "Pastane", "Pembe pastel, tatlı", { t: "kartli", pr: "#D6336C", se: "#862E51", bg: "#FFF5F8", tx: "#3D1F2C", cd: "#FFFFFF", ac: "#F06595", h: "Poppins", b: "Open Sans", rd: "lg", sh: "md", g: "#FFE3EC" }),
  P("firin", "Fırın & Bakery", "Buğday & kahve", { pr: "#B07D34", se: "#6B4F1D", bg: "#FBF5E9", tx: "#3A2C16", cd: "#FFFDF6", h: "Bitter", b: "Nunito Sans" }),
  P("dondurma", "Dondurma", "Nane & pembe, oyuncu", { t: "kartli", pr: "#FF6FB5", se: "#16BFA6", bg: "#F3FCFB", tx: "#2A3B3A", cd: "#FFFFFF", ac: "#16BFA6", h: "Quicksand", b: "Nunito Sans", rd: "lg", sh: "md" }),
  P("cikolata", "Çikolata", "Kakao & krem", { t: "klasik", pr: "#6B3F2B", se: "#3E2316", bg: "#F6EFE7", tx: "#33231A", cd: "#FFFDFA", h: "Cormorant Garamond", b: "Lato", sc: "lg" }),
  P("cupcake", "Cupcake", "Lavanta & pembe", { t: "kartli", pr: "#9B72CF", se: "#6D4AA0", bg: "#F7F2FC", tx: "#2E2440", cd: "#FFFFFF", ac: "#E59AC7", h: "Quicksand", b: "Open Sans", rd: "lg", sh: "md" }),
  P("tatlici", "Tatlıcı", "Altın & bordo (baklava)", { t: "elegant", pr: "#C99700", se: "#7B1E2B", bg: "#1A1410", tx: "#F2E7D2", cd: "#241B14", h: "Playfair Display", b: "Lato", rd: "sm", sh: "lg", ly: "list", g: "#120E0A" }),
  // — Sağlıklı & Vegan —
  P("organik", "Organik & Doğal", "Yeşil tonlar, doğal", { t: "klasik", pr: "#2D6A4F", se: "#1B4332", bg: "#F0F7F4", tx: "#1B2E25", cd: "#FFFFFF", ac: "#40916C", h: "Lora", b: "Nunito Sans" }),
  P("vegan", "Vegan", "Yaprak yeşili, taze", { pr: "#4D7C0F", se: "#3F6212", bg: "#F5FAEC", tx: "#26310F", cd: "#FFFFFF", h: "Quicksand", b: "Work Sans", rd: "lg" }),
  P("smoothie", "Smoothie Bar", "Canlı yeşil & turuncu", { pr: "#22C55E", se: "#15803D", bg: "#F2FBF4", tx: "#16301F", cd: "#FFFFFF", ac: "#FB923C", h: "Poppins", b: "Open Sans", rd: "lg", sh: "md" }),
  P("salata", "Salata & Bowl", "Adaçayı, ferah", { pr: "#6B8E5A", se: "#3F5232", bg: "#F4F7F0", tx: "#222B1B", cd: "#FFFFFF", h: "Outfit", b: "DM Sans" }),
  // — Deniz Ürünleri —
  P("deniz", "Deniz Ürünleri", "Okyanus mavisi, ferah", { pr: "#0077B6", se: "#023E8A", bg: "#F0F8FF", tx: "#03263F", cd: "#FFFFFF", ac: "#00B4D8", h: "Outfit", b: "DM Sans" }),
  P("balik", "Balık Lokantası", "Lacivert & kum", { t: "klasik", pr: "#1D4E89", se: "#12325A", bg: "#F4F7FB", tx: "#16243A", cd: "#FFFFFF", ac: "#E6B800", h: "Lora", b: "Lato", rd: "sm" }),
  P("sushi", "Sushi Bar", "Minimal siyah & kırmızı", { pr: "#C8102E", se: "#1A1A1A", bg: "#F6F6F6", tx: "#141414", cd: "#FFFFFF", h: "Space Grotesk", b: "Inter", rd: "sm", ly: "list" }),
  // — Dünya Mutfakları —
  P("japon", "Japon (Zen)", "Sade, kömür & kırmızı", { pr: "#B91C1C", se: "#2B2B2B", bg: "#F4F2EF", tx: "#1A1A1A", cd: "#FFFFFF", h: "Space Grotesk", b: "Inter", rd: "none", sh: "none", ly: "list", bv: "outline" }),
  P("asya", "Çin & Asya", "Kırmızı, altın, koyu", { t: "elegant", pr: "#E0A82E", se: "#9B1B1B", bg: "#1A1310", tx: "#F2E6CF", cd: "#241A14", ac: "#D62828", h: "Lora", b: "Lato", rd: "sm", sh: "lg", ly: "list", g: "#120D0A" }),
  P("meksika", "Meksika", "Terracotta & lime", { pr: "#D1431F", se: "#7C2D12", bg: "#FBF3E8", tx: "#34200F", cd: "#FFFFFF", ac: "#84B026", h: "Poppins", b: "Open Sans", sh: "md" }),
  P("hint", "Hint (Baharat)", "Safran & bordo", { t: "klasik", pr: "#E08D1E", se: "#7B1E2B", bg: "#FCF5E8", tx: "#3A2410", cd: "#FFFDF7", ac: "#B91C1C", h: "Lora", b: "Nunito Sans" }),
  P("kebap", "Kebap & Ocakbaşı", "Sıcak altın & kömür", { pr: "#C97B1E", se: "#7A4512", bg: "#FBF5EA", tx: "#33240F", cd: "#FFFFFF", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "sm" }),
  P("lubnan", "Lübnan & Mezze", "Zeytin & krem", { pr: "#6B7D3A", se: "#445021", bg: "#F7F6EC", tx: "#2A2C18", cd: "#FFFFFF", h: "Lora", b: "Lato" }),
  // — Bar & Gece —
  P("sarap-evi", "Şarap Evi", "Şarap kırmızısı, koyu", { t: "elegant", pr: "#9B2D4F", se: "#5C162E", bg: "#1A1014", tx: "#EFE0E4", cd: "#241419", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#120A0D" }),
  P("kokteyl", "Kokteyl Bar", "Neon mor, gece", { pr: "#A855F7", se: "#7C3AED", bg: "#120E1C", tx: "#ECE4F7", cd: "#1C1630", ac: "#22D3EE", h: "Outfit", b: "Inter", sh: "lg", ly: "list", g: "#0B0814" }),
  P("birahane", "Pub & Birahane", "Kehribar & kömür", { pr: "#D08C1E", se: "#7A4F12", bg: "#1A1611", tx: "#F0E6D4", cd: "#251F17", h: "Oswald", b: "Roboto", rd: "sm", sh: "md", ly: "list", g: "#12100B" }),
  P("cay-evi", "Çay Evi", "Yeşil & krem, huzurlu", { t: "klasik", pr: "#3E7C5A", se: "#27543C", bg: "#F4F8F4", tx: "#1F3328", cd: "#FFFFFF", h: "EB Garamond", b: "Lato", sc: "lg" }),
  // — Kahvaltı & Brunch —
  P("kahvalti", "Kahvaltı & Brunch", "Güneşli sarı, neşeli", { pr: "#F4A300", se: "#B45309", bg: "#FFFBEF", tx: "#33270F", cd: "#FFFFFF", ac: "#22A06B", h: "Poppins", b: "Open Sans", rd: "lg", sh: "md" }),
  P("koy-kahvalti", "Köy Kahvaltısı", "Yeşil & buğday", { pr: "#5C8A3A", se: "#3C5C23", bg: "#F7F5EA", tx: "#2A2E1A", cd: "#FFFFFF", ac: "#D9A441", h: "Lora", b: "Nunito Sans" }),
  // — Minimal & Modern —
  P("minimal", "Minimal", "Sade beyaz, gölgesiz", { t: "minimal", pr: "#1A1A1A", se: "#6B7280", bg: "#FFFFFF", tx: "#111111", cd: "#FAFAFA", h: "Inter", b: "Inter", rd: "sm", sh: "none", ly: "list", bv: "outline" }),
  P("modern-mono", "Modern Mono", "Kömür & beyaz", { t: "minimal", pr: "#27272A", se: "#71717A", bg: "#FAFAFA", tx: "#18181B", cd: "#FFFFFF", h: "Space Grotesk", b: "Inter", rd: "sm" }),
  P("iskandinav", "İskandinav", "Gri, beyaz, mavi", { pr: "#3B6E8F", se: "#2A4D63", bg: "#F4F6F8", tx: "#1F2933", cd: "#FFFFFF", h: "Work Sans", b: "Inter" }),
  P("pastel-modern", "Pastel Modern", "Yumuşak pastel", { t: "kartli", pr: "#7C9CBF", se: "#5A7DA0", bg: "#F6F4FB", tx: "#2E2A3A", cd: "#FFFFFF", ac: "#E6A4B4", h: "Quicksand", b: "Nunito Sans", rd: "lg" }),

  // ============================================================
  // VIP / LÜKS KOLEKSİYON — şık, gösterişli (hepsi premium kademesi).
  // Çoğu koyu + tek metalik aksan; aralarda canlı mücevher tonları ve gradyan
  // efektleri. Fontlar 400+700 ağırlıklı (Google Fonts isteği reddetmesin).
  // ============================================================

  // — Koyu + Altın / Şampanya (lüks gece) — altın kenar + ışıltı —
  P("altin-gece", "Altın Gece", "Siyah & altın, gradyanlı", { t: "elegant", pr: "#D4AF37", se: "#B8941F", bg: "#0E0E0E", tx: "#F0E9D6", cd: "#181613", ac: "#E9D8A6", h: "Playfair Display", b: "Montserrat", sc: "lg", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#060606", bd: "accent", dc: "glow" }),
  P("sampanya-luks", "Şampanya", "Antrasit & şampanya", { t: "elegant", pr: "#E6CFA3", se: "#B79A6A", bg: "#14110D", tx: "#EFE7D6", cd: "#1E1A14", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#0B0907", bd: "inset", dc: "glow" }),
  P("obsidyen-altin", "Obsidyen Altın", "Obsidyen siyah & altın", { t: "elegant", pr: "#C9A24A", se: "#8A6D2E", bg: "#0C0C0E", tx: "#ECE6D5", cd: "#16161A", h: "Cinzel", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#050507", bd: "accent", dc: "glow" }),
  P("kehribar-gece", "Kehribar Gece", "Koyu kahve & kehribar", { t: "elegant", pr: "#E0A82E", se: "#9A6B12", bg: "#15100A", tx: "#F1E6CF", cd: "#201810", h: "Cormorant Garamond", b: "Nunito Sans", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#0C0805", bd: "accent", dc: "glow" }),
  P("siyah-inci", "Siyah İnci", "Siyah & sedef", { t: "elegant", pr: "#CFC9BE", se: "#9A958B", bg: "#0D0D0F", tx: "#EDEAE3", cd: "#17171A", ac: "#E7E2D8", h: "Bodoni Moda", b: "Inter", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#060608", bd: "inset", dc: "glow" }),
  P("duman-altin", "Duman & Altın", "Dumanlı antrasit & altın", { t: "elegant", pr: "#C7A55C", se: "#7E6736", bg: "#161413", tx: "#E9E2D2", cd: "#211E1B", h: "Playfair Display", b: "Work Sans", rd: "sm", sh: "lg", ly: "list", g: "#0D0B0A", bd: "accent", dc: "glow" }),
  P("gece-yarisi-altin", "Gece Yarısı Altın", "Lacivert-siyah & altın", { t: "elegant", pr: "#D4AF37", se: "#1C2440", bg: "#0B0E18", tx: "#ECE6D6", cd: "#141826", ac: "#C9A24A", h: "Cinzel", b: "Lato", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#060810", bd: "accent", dc: "glow" }),
  P("luks-noir", "Noir", "Saf siyah & fildişi", { t: "elegant", pr: "#C9B27A", se: "#6E5E3A", bg: "#0A0A0A", tx: "#F2EEE3", cd: "#141414", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#000000", bd: "inset", dc: "glow" }),
  P("altin-tuy", "Altın Tüy", "Espresso siyah & yumuşak altın", { t: "elegant", pr: "#CBA258", se: "#8B6A2C", bg: "#131011", tx: "#ECE3D3", cd: "#1D1819", h: "Fraunces", b: "DM Sans", rd: "sm", sh: "lg", ly: "list", g: "#0A0708", bd: "accent", dc: "glow" }),
  P("kahve-altin", "Kahve & Altın", "Derin kahve & altın", { t: "elegant", pr: "#C99B41", se: "#6F4E37", bg: "#17110D", tx: "#EEE2CF", cd: "#221A13", h: "Lora", b: "Lato", rd: "sm", sh: "md", ly: "list", g: "#0D0906", bd: "accent", dc: "glow" }),

  // — Lacivert / Royal & Altın —
  P("safir-salon", "Safir Salon", "Safir lacivert & altın", { t: "elegant", pr: "#C9A24A", se: "#16224A", bg: "#0E1430", tx: "#E8E7DA", cd: "#16203F", ac: "#D9C27E", h: "Cinzel", b: "Lato", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#080C1E", bd: "accent", dc: "glow" }),
  P("kraliyet-lacivert", "Kraliyet Lacivert", "Royal lacivert & şampanya", { t: "elegant", pr: "#D8C089", se: "#243A6B", bg: "#101A38", tx: "#EAE9DD", cd: "#18244A", h: "Playfair Display", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", g: "#0A1226", bd: "accent", dc: "glow" }),
  P("gece-mavisi-vip", "Gece Mavisi", "Derin mavi & gümüş", { t: "elegant", pr: "#BFC6D4", se: "#2A3C66", bg: "#0F1426", tx: "#E7E9EF", cd: "#19203A", ac: "#8FA0C0", h: "Bodoni Moda", b: "Inter", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#090C18", bd: "inset", dc: "glow" }),
  P("denizci-altin", "Denizci Altın", "Petrol-lacivert & altın", { t: "elegant", pr: "#C9A24A", se: "#0E3B43", bg: "#0A1C20", tx: "#E6EAE6", cd: "#102A30", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#061216", bd: "accent", dc: "glow" }),

  // — Bordo / Şarap & Altın —
  P("bordo-kadife", "Bordo Kadife", "Kadife bordo & altın", { t: "elegant", pr: "#CDA45A", se: "#5A0E1E", bg: "#1A0A0F", tx: "#EFE0DE", cd: "#25121A", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#0E0508", bd: "accent", dc: "glow" }),
  P("sarap-altin", "Şarap & Altın", "Şarap kırmızısı & şampanya", { t: "elegant", pr: "#D9B877", se: "#6E1A2C", bg: "#190A10", tx: "#EEDFE0", cd: "#241019", h: "Playfair Display", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", g: "#0D050A", bd: "accent", dc: "glow" }),
  P("yakut-loca", "Yakut Loca", "Yakut kırmızısı & altın", { t: "elegant", pr: "#C9A24A", se: "#7B1322", bg: "#150709", tx: "#EEDDDB", cd: "#200E12", ac: "#E0B894", h: "Cinzel", b: "Lato", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#0B0405", bd: "inset", dc: "glow" }),

  // — Zümrüt / Orman & Altın —
  P("zumrut-loca", "Zümrüt Loca", "Zümrüt yeşili & altın", { t: "elegant", pr: "#C9A24A", se: "#0C3B2E", bg: "#08231C", tx: "#E6EBE4", cd: "#0E2E25", ac: "#D9C27E", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#051712", bd: "accent", dc: "glow" }),
  P("orman-altin", "Orman Altın", "Derin orman & pirinç", { t: "elegant", pr: "#BBA15A", se: "#173A2C", bg: "#0E1A14", tx: "#E7EAE2", cd: "#16261C", h: "Lora", b: "Lato", rd: "sm", sh: "lg", ly: "list", g: "#08110C", bd: "accent", dc: "glow" }),
  P("yesim-tasi", "Yeşim Taşı", "Yeşim yeşili & krem", { t: "elegant", pr: "#2E6F5E", se: "#1C4A3E", bg: "#F2F7F4", tx: "#1A2E28", cd: "#FFFFFF", ac: "#C9A24A", h: "Cormorant Garamond", b: "Inter", sc: "lg", rd: "md", sh: "md", bd: "accent" }),

  // — Gül Altını / Pudra (açık lüks) —
  P("gul-altini-vip", "Gül Altını", "Pudra krem & gül altını", { t: "kartli", pr: "#B76E79", se: "#9A4F5C", bg: "#FBF3F1", tx: "#3A2A2C", cd: "#FFFFFF", ac: "#C99A8E", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "lg", sh: "md", g: "#F5E3E0", bd: "accent", dc: "glow" }),
  P("pudra-luks", "Pudra Lüks", "Yumuşak pembe & altın taupe", { t: "kartli", pr: "#C2A07A", se: "#A07B5B", bg: "#FAF4EF", tx: "#38302A", cd: "#FFFFFF", ac: "#D8B6A6", h: "Playfair Display", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "hairline" }),
  P("inci-pembe", "İnci Pembe", "Sedef & gül", { t: "kartli", pr: "#C98B9A", se: "#8C5E6A", bg: "#FBF5F6", tx: "#34272B", cd: "#FFFFFF", h: "Bodoni Moda", b: "Nunito Sans", rd: "lg", sh: "md", bd: "hairline" }),

  // — Platin / Gümüş / Monokrom lüks —
  P("platin", "Platin", "Antrasit & platin", { t: "elegant", pr: "#C4C8CE", se: "#8B9098", bg: "#101113", tx: "#ECEDEF", cd: "#1A1C1F", ac: "#DDE0E4", h: "Bodoni Moda", b: "Inter", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#0A0B0D", bd: "accent", dc: "glow" }),
  P("gumus-gece", "Gümüş Gece", "Siyah & soğuk gümüş", { t: "elegant", pr: "#B9BEC6", se: "#777C84", bg: "#0E0F11", tx: "#EBECEE", cd: "#18191C", h: "Cinzel", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", g: "#08090A", bd: "accent", dc: "glow" }),
  P("monokrom-luks", "Monokrom Lüks", "Beyaz & grafit, sade prestij", { t: "minimal", pr: "#1C1C1E", se: "#6B6E73", bg: "#FFFFFF", tx: "#121214", cd: "#F6F6F7", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bv: "outline", bd: "hairline" }),

  // — Mermer / Krem & Bronz (açık lüks) —
  P("mermer-bronz", "Mermer & Bronz", "Mermer krem & bronz", { t: "elegant", pr: "#A8763E", se: "#6E4D28", bg: "#F4F1EB", tx: "#2A2620", cd: "#FFFFFF", ac: "#C29A5E", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "md", bd: "accent" }),
  P("fildisi-altin", "Fildişi Altın", "Fildişi & yumuşak altın", { t: "elegant", pr: "#B89248", se: "#8A6B2E", bg: "#FAF6EC", tx: "#2E2A1F", cd: "#FFFFFF", h: "Playfair Display", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "accent" }),
  P("kum-bej-luks", "Kum Bej", "Kum beji & taupe", { t: "elegant", pr: "#9C7A50", se: "#6E5638", bg: "#F6F1E8", tx: "#2E281F", cd: "#FFFFFF", ac: "#C2A074", h: "EB Garamond", b: "Work Sans", sc: "lg", rd: "md", sh: "sm", bd: "hairline" }),
  P("tas-gri-luks", "Taş Gri", "Taş grisi & bronz", { t: "elegant", pr: "#8A6E45", se: "#5C4A30", bg: "#F1F0EC", tx: "#26241F", cd: "#FFFFFF", h: "Lora", b: "Inter", rd: "sm", sh: "md", bd: "hairline" }),

  // — Mücevher tonları (canlılık) —
  P("ametist-vip", "Ametist", "Canlı mor & altın", { pr: "#9B59B6", se: "#6C3483", bg: "#1A0F22", tx: "#ECE2F2", cd: "#251635", ac: "#E0B84C", h: "Cormorant Garamond", b: "Montserrat", rd: "md", sh: "lg", ly: "list", g: "#0E0715", bd: "accent", dc: "glow" }),
  P("mor-kadife", "Mor Kadife", "Derin menekşe & şampanya", { t: "elegant", pr: "#C9A24A", se: "#4A1E6B", bg: "#160A24", tx: "#EAE2F0", cd: "#20103A", h: "Cinzel", b: "Lato", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#0B0518", bd: "accent", dc: "glow" }),
  P("turkuaz-vip", "Turkuaz Lüks", "Canlı turkuaz & altın", { pr: "#14B8A6", se: "#0F766E", bg: "#07221F", tx: "#E5F0EE", cd: "#0E302C", ac: "#D9C27E", h: "Outfit", b: "Inter", rd: "md", sh: "lg", ly: "list", g: "#04130F", bd: "accent", dc: "glow" }),
  P("safir-canli", "Canlı Safir", "Parlak safir & gümüş", { pr: "#2563EB", se: "#1E40AF", bg: "#0B1226", tx: "#E6EBF6", cd: "#131C36", h: "Space Grotesk", b: "Inter", rd: "md", sh: "lg", ly: "list", g: "#060A18", bd: "accent", dc: "glow" }),
  P("zumrut-canli", "Canlı Zümrüt", "Parlak zümrüt & krem", { pr: "#10B981", se: "#047857", bg: "#06231A", tx: "#E6F2EC", cd: "#0C3026", ac: "#E9D8A6", h: "Outfit", b: "DM Sans", rd: "md", sh: "lg", ly: "list", g: "#04130E", bd: "accent", dc: "glow" }),
  P("yakut-canli", "Canlı Yakut", "Parlak kızıl & altın", { pr: "#E63950", se: "#9B1B2E", bg: "#1A0A0E", tx: "#F0E0E2", cd: "#260F14", ac: "#D9B877", h: "Playfair Display", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", g: "#0D0407", bd: "accent", dc: "glow" }),

  // — Modern lüks gradyanlar (efekt) —
  P("altin-isilti", "Altın Işıltı", "Sıcak altın gradyan", { pr: "#F4C76B", se: "#C2410C", bg: "#1A120A", tx: "#F2E7D6", cd: "#241810", ac: "#E0A82E", h: "Outfit", b: "Inter", rd: "lg", sh: "lg", ly: "list", g: "#2A1206", bd: "accent", dc: "glow" }),
  P("gun-batimi-luks", "Gün Batımı Lüks", "Gün batımı gradyan", { pr: "#FF8A5B", se: "#C2410C", bg: "#1E1014", tx: "#F2E2DC", cd: "#2A171C", ac: "#F4C76B", h: "Outfit", b: "DM Sans", rd: "lg", sh: "lg", ly: "list", g: "#3A0F1E", bd: "accent", dc: "glow" }),
  P("aurora-luks", "Aurora", "Turkuaz → mor gradyan", { pr: "#22D3EE", se: "#7C3AED", bg: "#0C1024", tx: "#E6EAF4", cd: "#161A33", ac: "#C77DFF", h: "Space Grotesk", b: "Inter", rd: "lg", sh: "lg", ly: "list", g: "#1A0E33", bd: "accent", dc: "glow" }),
  P("neon-loca", "Neon Loca", "Neon pembe & camgöbeği", { pr: "#FF5FA2", se: "#A855F7", bg: "#100A1C", tx: "#F0E6F2", cd: "#1A1030", ac: "#22D3EE", h: "Outfit", b: "Inter", rd: "lg", sh: "lg", ly: "list", g: "#070410", bd: "accent", dc: "glow" }),
  P("bakir-isilti", "Bakır Işıltı", "Bakır gradyan", { t: "elegant", pr: "#D98A4E", se: "#8A4B23", bg: "#18100C", tx: "#EFE2D6", cd: "#231811", ac: "#E8B07A", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "md", sh: "lg", ly: "list", g: "#2A1206", bd: "accent", dc: "glow" }),
  P("gece-orkide", "Gece Orkide", "Orkide & erik gradyan", { pr: "#C77DFF", se: "#7B2CBF", bg: "#140A1E", tx: "#ECE2F2", cd: "#1F1030", h: "Outfit", b: "Montserrat", rd: "lg", sh: "lg", ly: "list", g: "#25103A", bd: "accent", dc: "glow" }),

  // — Minimal lüks (zarif açık) —
  P("editoryel-luks", "Editöryel", "Beyaz & siyah, yüksek kontrast", { t: "minimal", pr: "#1A1A1A", se: "#6B6B6B", bg: "#FFFFFF", tx: "#111111", cd: "#FAFAFA", ac: "#B89248", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bv: "outline", bd: "hairline" }),
  P("butik-krem", "Butik Krem", "Sıcak beyaz & ince altın", { t: "minimal", pr: "#2A2622", se: "#7A7066", bg: "#FAF8F4", tx: "#1E1B17", cd: "#FFFFFF", ac: "#B89248", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "none", ly: "list", bd: "accent" }),
  P("galeri-beyaz", "Galeri Beyaz", "Galeri beyazı & mürekkep", { t: "minimal", pr: "#16161A", se: "#6E6E76", bg: "#FCFCFD", tx: "#0F0F12", cd: "#FFFFFF", h: "Fraunces", b: "Inter", rd: "none", sh: "sm", ly: "list", bv: "outline", bd: "hairline" }),
  P("sade-prestij", "Sade Prestij", "Kırık beyaz & koyu yeşil aksan", { t: "minimal", pr: "#1F4D3D", se: "#5C6B63", bg: "#F6F7F4", tx: "#1A211D", cd: "#FFFFFF", ac: "#B89248", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "sm", bd: "hairline" }),

  // — Sıcak terracotta / baharat lüks —
  P("terra-luks", "Terra Lüks", "Terracotta & krem", { t: "elegant", pr: "#B5562F", se: "#7C2D12", bg: "#FAF2EA", tx: "#33200F", cd: "#FFFFFF", ac: "#C99B41", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "accent" }),
  P("baharat-gece", "Baharat Gece", "Safran & koyu baharat", { t: "elegant", pr: "#E0A82E", se: "#7B1E2B", bg: "#1A1209", tx: "#F1E6CF", cd: "#251A0F", ac: "#D98A4E", h: "Lora", b: "Nunito Sans", rd: "sm", sh: "lg", ly: "list", g: "#0E0905", bd: "accent", dc: "glow" }),

  // ============================================================
  // VIP KOLEKSİYON II — ince, uyumlu premium çizgiler (abartısız şıklık).
  // ============================================================
  P("siyah-altin-cizgi", "Siyah Altın Çizgi", "Siyah & altın çerçeve", { t: "elegant", pr: "#D4AF37", se: "#9A7B1F", bg: "#0C0C0C", tx: "#EFE8D4", cd: "#151310", ac: "#E6D29A", h: "Cinzel", b: "Montserrat", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#050505", bd: "accent", dc: "frame" }),
  P("antrasit-platin", "Antrasit Platin", "Antrasit & platin çizgi", { t: "elegant", pr: "#C7CBD1", se: "#82878F", bg: "#121316", tx: "#ECEEF1", cd: "#1B1D21", ac: "#DEE1E6", h: "Bodoni Moda", b: "Inter", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#0B0C0E", bd: "accent", dc: "glow" }),
  P("gece-zumrut", "Gece Zümrüt", "Derin zümrüt & altın çizgi", { t: "elegant", pr: "#C9A24A", se: "#0E4234", bg: "#07251D", tx: "#E7EDE7", cd: "#0E3127", ac: "#DCC785", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#04150F", bd: "accent", dc: "glow" }),
  P("kadife-lacivert", "Kadife Lacivert", "Lacivert kadife & şampanya", { t: "elegant", pr: "#D7C08A", se: "#1E2C54", bg: "#0C1230", tx: "#E9E8DC", cd: "#141B40", h: "Playfair Display", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#070B20", bd: "accent", dc: "glow" }),
  P("bronz-gece", "Bronz Gece", "Koyu & bronz çizgi", { t: "elegant", pr: "#C08552", se: "#7A4E2B", bg: "#15110D", tx: "#EDE2D5", cd: "#201913", ac: "#D49A66", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#0B0805", bd: "accent", dc: "glow" }),
  P("ipek-krem", "İpek Krem", "İpek krem & ince altın", { t: "elegant", pr: "#B49250", se: "#897039", bg: "#FBF7EF", tx: "#2E281C", cd: "#FFFFFF", ac: "#CDAE6A", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "hairline" }),
  P("sedef-gri", "Sedef Gri", "Sedef gri & gümüş çizgi", { t: "elegant", pr: "#6E737A", se: "#4A4E54", bg: "#F4F5F6", tx: "#23262A", cd: "#FFFFFF", ac: "#9AA0A8", h: "Bodoni Moda", b: "Inter", rd: "sm", sh: "sm", bd: "hairline" }),
  P("altin-mermer", "Altın Mermer", "Mermer & altın aksan", { t: "elegant", pr: "#B08A3C", se: "#7A5E22", bg: "#F5F2EC", tx: "#2C2720", cd: "#FFFFFF", ac: "#C9A24A", h: "Playfair Display", b: "Montserrat", sc: "lg", rd: "sm", sh: "md", bd: "accent" }),
  P("derin-bordo", "Derin Bordo", "Derin şarap & altın", { t: "elegant", pr: "#C9A24A", se: "#6A1525", bg: "#170810", tx: "#EEDFE1", cd: "#220E16", ac: "#D9B877", h: "Cinzel", b: "Lato", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#0C040A", bd: "accent", dc: "glow" }),
  P("zeytin-altin", "Zeytin Altın", "Zeytin yeşili & altın", { t: "elegant", pr: "#C2A24E", se: "#44502A", bg: "#14160E", tx: "#EAE7D6", cd: "#1E2116", ac: "#D6BE72", h: "Lora", b: "Nunito Sans", rd: "sm", sh: "lg", ly: "list", g: "#0A0B06", bd: "accent", dc: "glow" }),
  P("gece-safir", "Gece Safir", "Safir & gümüş iç çizgi", { t: "elegant", pr: "#BFC8DB", se: "#21407A", bg: "#0A1024", tx: "#E6EAF2", cd: "#131A36", ac: "#9FB2D6", h: "Bodoni Moda", b: "Inter", rd: "none", sh: "lg", ly: "list", bv: "outline", g: "#060A18", bd: "inset", dc: "glow" }),
  P("kobalt-luks", "Kobalt Lüks", "Canlı kobalt & altın", { pr: "#2F6BE0", se: "#1C3F94", bg: "#0A1026", tx: "#E5EAF6", cd: "#121A3A", ac: "#E0B84C", h: "Space Grotesk", b: "Inter", rd: "md", sh: "lg", ly: "list", g: "#060A1A", bd: "accent", dc: "glow" }),
  P("mercan-luks", "Mercan Lüks", "Mercan & krem, altın çizgi", { t: "elegant", pr: "#E26A55", se: "#B23A2A", bg: "#FBF3F0", tx: "#3A241F", cd: "#FFFFFF", ac: "#C9A24A", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "md", sh: "md", bd: "accent" }),
  P("lacivert-bakir", "Lacivert Bakır", "Lacivert & bakır çizgi", { t: "elegant", pr: "#C58450", se: "#1F2C50", bg: "#0C1124", tx: "#EBE7DD", cd: "#141A36", ac: "#D89A66", h: "Playfair Display", b: "Lato", rd: "sm", sh: "lg", ly: "list", g: "#070B1A", bd: "accent", dc: "glow" }),
  P("orkide-luks", "Orkide Lüks", "Orkide & altın", { t: "elegant", pr: "#C9A24A", se: "#5A2A7A", bg: "#160A22", tx: "#EBE2F0", cd: "#1F1136", h: "Cinzel", b: "Montserrat", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#0B0518", bd: "accent", dc: "glow" }),
  P("gece-yesili", "Gece Yeşili", "Koyu yeşil & iç çizgi", { t: "elegant", pr: "#CFE0CC", se: "#2A5A3F", bg: "#0A1B12", tx: "#E7EEE5", cd: "#11271A", ac: "#BFD8B8", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#061009", bd: "inset", dc: "glow" }),
  P("fume-altin", "Füme Altın", "Füme gri & altın çerçeve", { t: "elegant", pr: "#C8A560", se: "#6E5A33", bg: "#18181A", tx: "#EAE6DC", cd: "#222226", ac: "#DBBE7A", h: "Cormorant Garamond", b: "Inter", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#0E0E10", bd: "accent", dc: "frame" }),
  P("krem-bronz", "Krem Bronz", "Krem & bronz çizgi", { t: "elegant", pr: "#A8763E", se: "#6E4D28", bg: "#F7F2E9", tx: "#2E271E", cd: "#FFFFFF", ac: "#C49457", h: "EB Garamond", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "hairline" }),
  P("siyah-gul", "Siyah Gül", "Siyah & gül altını", { t: "elegant", pr: "#C98B86", se: "#8C5A57", bg: "#100C0D", tx: "#EDE3E2", cd: "#1A1415", ac: "#D8A39E", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "lg", ly: "list", bv: "outline", g: "#070506", bd: "accent", dc: "glow" }),
  P("petrol-altin", "Petrol Altın", "Petrol yeşili & altın", { t: "elegant", pr: "#C9A24A", se: "#0E3A40", bg: "#07201F", tx: "#E6EBE9", cd: "#0E2C2C", ac: "#D9C27E", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "lg", ly: "list", g: "#04100F", bd: "accent", dc: "glow" }),

  // ============================================================
  // BEYAZ PREMIUM KOLEKSİYON — beyaz yoğunluklu, ince altın/füme çizgiler,
  // ferah arka plan, gerçek premium his. Hepsi premium kademesi.
  // ============================================================
  P("saf-beyaz-altin", "Saf Beyaz Altın", "Saf beyaz & altın çerçeve", { t: "minimal", pr: "#B89248", se: "#8A6B2E", bg: "#FFFFFF", tx: "#1C1A14", cd: "#FFFFFF", ac: "#C9A24A", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "none", ly: "list", bd: "accent", dc: "frame" }),
  P("kar-beyazi", "Kar Beyazı", "Kar beyazı & ince kömür", { t: "minimal", pr: "#1F1F22", se: "#6B6E73", bg: "#FFFFFF", tx: "#14141A", cd: "#FFFFFF", ac: "#B89248", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bv: "outline", bd: "hairline", dc: "frame" }),
  P("fildisi-zarafet", "Fildişi Zarafet", "Fildişi & altın çizgi", { t: "elegant", pr: "#B08A3C", se: "#7A5E22", bg: "#FBF8F1", tx: "#2A251A", cd: "#FFFFFF", ac: "#C9A24A", h: "Playfair Display", b: "Lato", sc: "lg", rd: "sm", sh: "sm", bd: "accent", dc: "frame" }),
  P("porselen", "Porselen", "Porselen beyazı & lacivert çizgi", { t: "elegant", pr: "#2A3C5E", se: "#5C6B82", bg: "#FCFCFD", tx: "#1A2030", cd: "#FFFFFF", ac: "#B89248", h: "Cormorant Garamond", b: "Inter", sc: "lg", rd: "sm", sh: "sm", bd: "hairline", dc: "frame" }),
  P("krem-prestij", "Krem Prestij", "Krem & altın", { t: "elegant", pr: "#A8823C", se: "#7A5E22", bg: "#FAF6EE", tx: "#2C2618", cd: "#FFFFFF", ac: "#C9A24A", h: "EB Garamond", b: "Montserrat", sc: "lg", rd: "md", sh: "sm", bd: "accent" }),
  P("beyaz-altin-cizgi", "Beyaz Altın Çizgi", "Beyaz & iç altın çizgi", { t: "elegant", pr: "#C9A24A", se: "#8A6B2E", bg: "#FFFFFF", tx: "#1E1B14", cd: "#FCFAF4", ac: "#B89248", h: "Cinzel", b: "Lato", sc: "lg", rd: "sm", sh: "sm", ly: "list", bd: "inset", dc: "frame" }),
  P("mermer-beyaz", "Mermer Beyaz", "Mermer beyazı & altın", { t: "elegant", pr: "#9C7A50", se: "#6E5638", bg: "#F6F4F0", tx: "#2A2620", cd: "#FFFFFF", ac: "#C2A074", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "sm", bd: "accent" }),
  P("sade-beyaz-luks", "Sade Beyaz Lüks", "Minimal beyaz & ince siyah", { t: "minimal", pr: "#18181A", se: "#6E6E76", bg: "#FFFFFF", tx: "#101012", cd: "#FAFAFA", ac: "#1A1A1A", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bv: "outline", bd: "hairline", dc: "frame" }),
  P("inci-beyaz", "İnci Beyazı", "Sedef beyaz & gül altını", { t: "elegant", pr: "#C49A8E", se: "#9A7068", bg: "#FCF8F7", tx: "#2E2624", cd: "#FFFFFF", ac: "#C9A24A", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "hairline" }),
  P("zarif-krem", "Zarif Krem", "Yumuşak krem & adaçayı çizgi", { t: "elegant", pr: "#5C7359", se: "#3F5240", bg: "#F7F8F4", tx: "#232A22", cd: "#FFFFFF", ac: "#B89248", h: "EB Garamond", b: "Inter", sc: "lg", rd: "sm", sh: "sm", bd: "hairline", dc: "frame" }),
  P("beyaz-mermer-altin", "Beyaz Mermer Altın", "Beyaz mermer & altın çerçeve", { t: "elegant", pr: "#B89248", se: "#8A6B2E", bg: "#FAFAF8", tx: "#26241E", cd: "#FFFFFF", ac: "#C9A24A", h: "Playfair Display", b: "Montserrat", sc: "lg", rd: "sm", sh: "none", bd: "accent", dc: "frame" }),
  P("tebesir-beyaz", "Tebeşir Beyazı", "Tebeşir beyazı & kömür", { t: "minimal", pr: "#2A2A2E", se: "#70737A", bg: "#FCFCFB", tx: "#18181C", cd: "#FFFFFF", ac: "#9C7A50", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bd: "hairline", dc: "frame" }),
  P("sampanya-beyaz", "Şampanya Beyazı", "Fildişi & şampanya altını", { t: "elegant", pr: "#C09A4A", se: "#8A6B2E", bg: "#FBF7EE", tx: "#2E281C", cd: "#FFFFFF", ac: "#D4AF37", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "accent" }),
  P("beyaz-bordo", "Beyaz Bordo", "Beyaz & ince bordo", { t: "elegant", pr: "#7B2D26", se: "#5A1E1A", bg: "#FCFAF8", tx: "#2A1C1A", cd: "#FFFFFF", ac: "#B89248", h: "Playfair Display", b: "Lato", sc: "lg", rd: "sm", sh: "sm", bd: "hairline", dc: "frame" }),
  P("beyaz-lacivert", "Beyaz Lacivert", "Beyaz & lacivert çizgi", { t: "elegant", pr: "#1E2C54", se: "#4A597E", bg: "#FCFCFE", tx: "#1A2030", cd: "#FFFFFF", ac: "#B89248", h: "Cormorant Garamond", b: "Inter", sc: "lg", rd: "sm", sh: "sm", ly: "list", bd: "accent", dc: "frame" }),
  P("ipeksi-beyaz", "İpeksi Beyaz", "İpeksi beyaz & altın", { t: "elegant", pr: "#B49250", se: "#897039", bg: "#FCF9F3", tx: "#2C271B", cd: "#FFFFFF", ac: "#CDAE6A", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "md", sh: "sm", bd: "hairline" }),
  P("saray-beyazi", "Saray Beyazı", "Saray beyazı & altın çerçeve", { t: "elegant", pr: "#C9A24A", se: "#8A6B2E", bg: "#FBF8F2", tx: "#2A2418", cd: "#FFFFFF", ac: "#D4AF37", h: "Cinzel", b: "Lato", sc: "lg", rd: "sm", sh: "sm", ly: "list", bv: "outline", bd: "accent", dc: "frame" }),
  P("minimal-altin", "Minimal Altın", "Minimal beyaz & tek altın çizgi", { t: "minimal", pr: "#B89248", se: "#8A6B2E", bg: "#FFFFFF", tx: "#1A1A1A", cd: "#FFFFFF", ac: "#C9A24A", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bv: "outline", bd: "accent" }),
  P("beyaz-zumrut", "Beyaz Zümrüt", "Beyaz & zümrüt çizgi", { t: "elegant", pr: "#1F5A47", se: "#143D30", bg: "#FAFCFA", tx: "#1A2A24", cd: "#FFFFFF", ac: "#B89248", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "sm", bd: "hairline", dc: "frame" }),
  P("krem-altin-cerceve", "Krem Altın Çerçeve", "Krem & altın çerçeve", { t: "elegant", pr: "#B08A3C", se: "#7A5E22", bg: "#FAF5EC", tx: "#2E2718", cd: "#FFFFFF", ac: "#C9A24A", h: "EB Garamond", b: "Lato", sc: "lg", rd: "sm", sh: "none", bd: "accent", dc: "frame" }),
  P("beyaz-prestij", "Beyaz Prestij", "Parlak beyaz & kömür+altın", { t: "minimal", pr: "#1C1C1E", se: "#6E6E76", bg: "#FFFFFF", tx: "#121214", cd: "#F7F7F6", ac: "#B89248", h: "Bodoni Moda", b: "Montserrat", sc: "lg", rd: "none", sh: "sm", ly: "list", bd: "hairline", dc: "frame" }),
  P("sicak-beyaz", "Sıcak Beyaz", "Sıcak beyaz & yumuşak altın", { t: "elegant", pr: "#B49250", se: "#8A6B2E", bg: "#FBF9F4", tx: "#2C281E", cd: "#FFFFFF", ac: "#CDAE6A", h: "Cormorant Garamond", b: "Lato", sc: "lg", rd: "md", sh: "sm", bd: "accent" }),
  P("beyaz-gul-altini", "Beyaz Gül Altını", "Beyaz & gül altını çizgi", { t: "elegant", pr: "#C19A8E", se: "#9A7068", bg: "#FDF9F8", tx: "#2E2624", cd: "#FFFFFF", ac: "#C9A24A", h: "Cormorant Garamond", b: "Montserrat", sc: "lg", rd: "md", sh: "sm", bd: "accent", dc: "frame" }),
  P("galeri-altin", "Galeri Altın", "Galeri beyazı & altın çizgi", { t: "minimal", pr: "#16161A", se: "#6E6E76", bg: "#FCFCFD", tx: "#0F0F12", cd: "#FFFFFF", ac: "#C9A24A", h: "Fraunces", b: "Inter", sc: "lg", rd: "none", sh: "sm", ly: "list", bv: "outline", bd: "accent", dc: "frame" }),
  P("beyaz-bakir", "Beyaz Bakır", "Beyaz & bakır çizgi", { t: "elegant", pr: "#B07344", se: "#7A4E2B", bg: "#FBF7F2", tx: "#2E251C", cd: "#FFFFFF", ac: "#C9A24A", h: "Cormorant Garamond", b: "Work Sans", sc: "lg", rd: "sm", sh: "sm", bd: "hairline" }),
  P("sade-altin-cizgi", "Sade Altın Çizgi", "Temiz beyaz & iç altın çizgi", { t: "elegant", pr: "#C9A24A", se: "#8A6B2E", bg: "#FFFFFF", tx: "#1E1B14", cd: "#FFFFFF", ac: "#B89248", h: "Cormorant Garamond", b: "Inter", sc: "lg", rd: "sm", sh: "none", ly: "list", bd: "inset", dc: "frame" }),
  P("mermer-gri-beyaz", "Mermer Gri Beyaz", "Beyaz-gri mermer & altın", { t: "elegant", pr: "#9C7A50", se: "#6E5638", bg: "#F5F5F3", tx: "#28261F", cd: "#FFFFFF", ac: "#C2A074", h: "Playfair Display", b: "Inter", sc: "lg", rd: "sm", sh: "sm", bd: "accent" }),
  P("beyaz-lux-serif", "Beyaz Lüks Serif", "Beyaz & zarif serif altın", { t: "elegant", pr: "#A8823C", se: "#7A5E22", bg: "#FCFAF5", tx: "#2A2518", cd: "#FFFFFF", ac: "#C9A24A", h: "EB Garamond", b: "Montserrat", sc: "lg", rd: "sm", sh: "sm", ly: "list", bd: "accent", dc: "frame" }),
  P("kar-altin", "Kar Altın", "Kar beyazı & net altın kenar", { t: "elegant", pr: "#C9A24A", se: "#8A6B2E", bg: "#FFFFFF", tx: "#1C1A14", cd: "#FCFAF4", ac: "#D4AF37", h: "Cinzel", b: "Lato", sc: "lg", rd: "sm", sh: "sm", bd: "accent", dc: "frame" }),
  P("beyaz-zarafet", "Beyaz Zarafet", "Beyaz zarafet & ince çerçeve", { t: "minimal", pr: "#2A2A2E", se: "#70737A", bg: "#FFFFFF", tx: "#14141A", cd: "#FAFAFA", ac: "#B89248", h: "Bodoni Moda", b: "Inter", sc: "lg", rd: "none", sh: "none", ly: "list", bv: "outline", bd: "hairline", dc: "frame" }),
];

// ============================================================
// TEMA GRUPLARI — picker'da 3 sekme: Beyaz / Premium / Şık.
// Beyaz: ferah açık temalar. Premium: koyu altın/metalik lüks.
// Şık: renkli/canlı/modern. (Paket kademesinden bağımsız; sadece düzen.)
// ============================================================

export type ThemeGroup = "beyaz" | "premium" | "sik";

export const THEME_GROUPS: { key: ThemeGroup; label: string }[] = [
  { key: "beyaz", label: "Beyaz Şablonlar" },
  { key: "premium", label: "Premium Şablonlar" },
  { key: "sik", label: "Şık Şablonlar" },
];

// "Beyaz" grubuna ait keyler (yeni 30 beyaz premium + mevcut açık/zarif).
const BEYAZ_KEYS = new Set<string>([
  "minimal", "modern-mono", "iskandinav", "specialty", "sushi", "japon",
  "monokrom-luks", "galeri-beyaz", "editoryel-luks", "butik-krem", "sade-prestij",
  "fildisi-altin", "mermer-bronz", "kum-bej-luks", "tas-gri-luks", "ipek-krem",
  "sedef-gri", "altin-mermer", "krem-bronz", "mermer",
  "saf-beyaz-altin", "kar-beyazi", "fildisi-zarafet", "porselen", "krem-prestij",
  "beyaz-altin-cizgi", "mermer-beyaz", "sade-beyaz-luks", "inci-beyaz", "zarif-krem",
  "beyaz-mermer-altin", "tebesir-beyaz", "sampanya-beyaz", "beyaz-bordo", "beyaz-lacivert",
  "ipeksi-beyaz", "saray-beyazi", "minimal-altin", "beyaz-zumrut", "krem-altin-cerceve",
  "beyaz-prestij", "sicak-beyaz", "beyaz-gul-altini", "galeri-altin", "beyaz-bakir",
  "sade-altin-cizgi", "mermer-gri-beyaz", "beyaz-lux-serif", "kar-altin", "beyaz-zarafet",
]);

// Koyu ama "şık/canlı" (lüks değil) → şık grubuna sabit.
const SIK_KEYS = new Set<string>([
  "neon-loca", "aurora-luks", "gece-orkide", "kobalt-luks", "turkuaz-vip",
  "safir-canli", "zumrut-canli", "yakut-canli", "ametist-vip", "altin-isilti",
  "gun-batimi-luks", "sokak-lezzeti",
]);

// hex algısal parlaklığı (0..1).
function bgLum(hex: string): number {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function presetGroup(p: ThemePreset): ThemeGroup {
  if (BEYAZ_KEYS.has(p.key)) return "beyaz";
  if (SIK_KEYS.has(p.key)) return "sik";
  // Koyu arka plan → premium; açık-renkli/orta → şık.
  return bgLum(p.theme.colors.background) < 0.35 ? "premium" : "sik";
}
