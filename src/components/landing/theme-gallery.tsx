import { MiniMenu } from "@/components/landing/mini-menu";
import { googleFontsHrefMulti } from "@/lib/theme/css";
import { THEME_PRESETS } from "@/lib/theme/schema";

// Landing: 150 hazır temanın en güçlü kanıtı — gerçek mini menülerle render
// edilmiş, yatay sonsuz kayan bir şerit. Sektör çeşitliliğini gösterir.

const CURATED = [
  "altin-gece",
  "saf-beyaz-altin",
  "safir-salon",
  "beyaz-lacivert",
  "bordo-kadife",
  "kar-altin",
  "neon-loca",
  "mermer-beyaz",
  "zumrut-loca",
  "modern-kafe",
  "platin",
  "saray-beyazi",
  "kokteyl",
  "beyaz-prestij",
];

const PRESETS = CURATED.map((k) => THEME_PRESETS.find((p) => p.key === k)).filter(
  (p): p is (typeof THEME_PRESETS)[number] => Boolean(p),
);

const FONTS_HREF = googleFontsHrefMulti(
  PRESETS.flatMap((p) => [p.theme.font.heading, p.theme.font.body]),
);

export function ThemeGallery() {
  // Kusursuz döngü için şerit iki kez render edilir (-50% bir tam tur).
  const loop = [...PRESETS, ...PRESETS];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={FONTS_HREF} />

      <div className="kafe-marquee-wrap relative overflow-hidden">
        {/* Kenar yumuşatma (fade) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-24" />

        <div className="kafe-marquee-track flex w-max gap-4 py-1">
          {loop.map((p, i) => (
            <figure
              key={`${p.key}-${i}`}
              className="w-44 shrink-0 overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="h-40">
                <MiniMenu theme={p.theme} name={p.name} />
              </div>
              <figcaption className="border-t px-3 py-2">
                <div className="truncate text-xs font-semibold">{p.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {p.desc}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
