import type { CSSProperties } from "react";
import type { ThemeSettings } from "./schema";

// theme_settings → CSS değişkenleri. Hem customizer önizlemesi hem public menü
// bu fonksiyonu kullanır (tek kaynak → tutarlılık).

export const RADIUS_PX: Record<string, string> = {
  none: "0px",
  sm: "8px",
  md: "12px",
  lg: "20px",
};

export const SHADOW_CSS: Record<string, string> = {
  // ÖNEMLİ: "none" yerine şeffaf gölge → box-shadow listesinde (gölge + kenar
  // çizgisi birlikte) geçerli kalır. "none, <çizgi>" CSS'i geçersizdir.
  none: "0 0 #0000",
  sm: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)",
  md: "0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)",
};

export const FONT_SCALE: Record<string, { heading: string; body: string }> = {
  sm: { heading: "1.25rem", body: "0.8125rem" },
  md: { heading: "1.5rem", body: "0.9375rem" },
  lg: { heading: "1.75rem", body: "1.0625rem" },
  xl: { heading: "2rem", body: "1.1875rem" },
};

// Derinlemesine savunma: şema yazma kapısı geçilse bile public menüde tehlikeli
// CSS render edilmez (tırnak/parantez strip + gradyan whitelist).
export function backgroundCss(t: ThemeSettings): string {
  const b = t.background;
  const strip = (s: string) => s.replace(/["'()\\;]/g, "");
  if (b.type === "gradient") {
    return /^(?:linear|radial)-gradient\([a-zA-Z0-9#%.,\s-]+\)$/.test(b.value)
      ? b.value
      : t.colors.background;
  }
  if (b.type === "image") {
    const v = strip(b.value);
    return v ? `center / cover no-repeat url("${v}")` : t.colors.background;
  }
  return b.value || t.colors.background;
}

export function themeToCssVars(t: ThemeSettings): CSSProperties {
  const scale = FONT_SCALE[t.font.scale] ?? FONT_SCALE.md;
  const accent = t.colors.accent;
  // Kart kenar efekti — ince ama belirgin "premium çizgi".
  // accent: net altın/metalik 1px çizgi + kart içine hafif eşlik çizgisi (çift his).
  const cardBorder =
    t.card_style.border === "hairline"
      ? `1px solid color-mix(in srgb, ${t.colors.text} 28%, transparent)`
      : t.card_style.border === "accent"
        ? `1px solid color-mix(in srgb, ${accent} 92%, transparent)`
        : "none";
  // box-shadow ile çizilen ek çizgi:
  //   inset → belirgin iç hairline; accent → çok hafif iç eşlik çizgisi.
  const cardLine =
    t.card_style.border === "inset"
      ? `inset 0 0 0 1px color-mix(in srgb, ${accent} 85%, transparent)`
      : t.card_style.border === "accent"
        ? `inset 0 0 0 1px color-mix(in srgb, ${accent} 20%, transparent)`
        : "0 0 #0000";
  // Arka plan efekti: belirgin ama yumuşak ışıltı.
  const decorLayer =
    t.decor === "glow"
      ? `radial-gradient(130% 78% at 50% -10%, color-mix(in srgb, ${accent} 26%, transparent), transparent 58%)`
      : "linear-gradient(#0000, #0000)";
  // "frame" → menü içeriğini saran görünür ince iç çerçeve.
  const frame =
    t.decor === "frame"
      ? `inset 0 0 0 1px color-mix(in srgb, ${accent} 55%, transparent)`
      : "0 0 #0000";
  return {
    "--menu-primary": t.colors.primary,
    "--menu-secondary": t.colors.secondary,
    "--menu-bg": t.colors.background,
    "--menu-text": t.colors.text,
    "--menu-accent": t.colors.accent,
    "--menu-card-bg": t.colors.card_bg,
    "--menu-radius-card": RADIUS_PX[t.card_style.border_radius] ?? "12px",
    "--menu-radius-btn": RADIUS_PX[t.button_style.border_radius] ?? "12px",
    "--menu-shadow-card": SHADOW_CSS[t.card_style.shadow] ?? "none",
    "--menu-font-heading": `"${t.font.heading}", serif`,
    "--menu-font-body": `"${t.font.body}", sans-serif`,
    "--menu-size-heading": scale.heading,
    "--menu-size-body": scale.body,
    "--menu-bg-css": backgroundCss(t),
    "--menu-card-border": cardBorder,
    "--menu-card-line": cardLine,
    "--menu-decor": decorLayer,
    "--menu-frame": frame,
  } as CSSProperties;
}

// Google Fonts link href (heading + body).
// ÖNEMLİ: Sadece 400 ve 700 iste. Tek bir font istenen ağırlığa sahip değilse
// (örn. Bebas Neue'de 500/600/700 yok) Google Fonts TÜM isteği reddeder ve hiçbir
// font yüklenmez. 400 ve 700 neredeyse tüm metin fontlarında bulunur.
export function googleFontsHref(t: ThemeSettings): string {
  return googleFontsHrefMulti([t.font.heading, t.font.body]);
}

// Birden çok font ailesi için tek link (preset ızgarası gibi yerlerde).
export function googleFontsHrefMulti(fonts: string[]): string {
  const families = Array.from(new Set(fonts.filter(Boolean)))
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
