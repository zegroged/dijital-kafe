import { MiniMenu } from "@/components/landing/mini-menu";
import { googleFontsHrefMulti } from "@/lib/theme/css";
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  type ThemeSettings,
} from "@/lib/theme/schema";

// Hero görseli: bir telefon çerçevesi içinde GERÇEK bir mini menü.
// Standalone çıktı public/uploads'ı servis etmediği için tüm görsel
// inline/CSS — harici görsel yok, her zaman keskin ve hızlı.

const HERO_THEME: ThemeSettings =
  THEME_PRESETS.find((p) => p.key === "modern-kafe")?.theme ?? DEFAULT_THEME;

const HERO_ITEMS = [
  { name: "Flat White", price: "₺75" },
  { name: "San Sebastian", price: "₺140" },
  { name: "Avokado Tost", price: "₺165" },
  { name: "Ev Limonatası", price: "₺60" },
];

const FONTS_HREF = googleFontsHrefMulti([
  HERO_THEME.font.heading,
  HERO_THEME.font.body,
]);

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[230px] sm:w-[260px]">
      <link rel="stylesheet" href={FONTS_HREF} />

      {/* Sıcak ışıma */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,107,53,0.35), transparent 70%)",
        }}
      />

      {/* Telefon çerçevesi */}
      <div className="rounded-[2.2rem] border border-black/10 bg-neutral-900 p-2 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-white">
          {/* Çentik */}
          <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/25" />
          <div className="h-[420px]">
            <MiniMenu
              theme={HERO_THEME}
              name="Kahvecim"
              items={HERO_ITEMS}
              className="pt-7"
            />
          </div>
        </div>
      </div>

      {/* Yüzen QR rozeti */}
      <div className="absolute -bottom-4 -right-3 rotate-3 rounded-xl border bg-card px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="size-6 text-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3M20 14v.01M14 20h.01M20 20v.01M17 20h.01M20 17h.01" />
          </svg>
          <span className="text-xs font-semibold leading-tight">
            Okut &<br />
            görüntüle
          </span>
        </div>
      </div>
    </div>
  );
}
