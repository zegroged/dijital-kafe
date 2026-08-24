import { MenuBrowser } from "@/components/menu/menu-browser";
import { SmartImage } from "@/components/ui/smart-image";
import type {
  PublicCategory,
  PublicDish,
  PublicRestaurant,
} from "@/components/menu/types";
import { googleFontsHrefMulti, themeToCssVars } from "@/lib/theme/css";
import type { ThemeSettings } from "@/lib/theme/schema";

// Yayında + görünür menünün tam görünümü.
// Mobil-first, akışkan responsive: sabit px genişlik yok; clamp()/%/grid auto-fit.
// İçerik 2 katmanlı: önce kategori kartları, tıklayınca o kategorinin ürünleri.

type Props = {
  theme: ThemeSettings;
  restaurant: PublicRestaurant;
  categories: PublicCategory[];
  dishes: PublicDish[];
};

export function MenuView({ theme, restaurant, categories, dishes }: Props) {
  const layout = theme.card_style.layout;

  // Menü + tüm kategori temalarının fontlarını tek seferde yükle.
  const fonts = [theme.font.heading, theme.font.body];
  for (const c of categories) {
    if (c.theme) fonts.push(c.theme.font.heading, c.theme.font.body);
  }

  return (
    <>
      {/* Fontları erken bağla: render'ı blokuyan stylesheet'in gecikmesini kısar. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsHrefMulti(fonts)} />
      <main
        style={{
          ...themeToCssVars(theme),
          background: "var(--menu-decor), var(--menu-bg-css)",
          boxShadow: "var(--menu-frame)",
          color: "var(--menu-text)",
          fontFamily: "var(--menu-font-body)",
          fontSize: "var(--menu-size-body)",
        }}
        className="min-h-screen w-full"
      >
        {/* --- Başlık alanı --- */}
        <header className="relative w-full">
          {restaurant.coverImageUrl ? (
            <div className="relative h-[clamp(140px,32vw,260px)] w-full overflow-hidden">
              {/* Kapak ekranın en üstünde → priority (eager + fetchPriority=high). */}
              <SmartImage
                src={restaurant.coverImageUrl}
                alt={restaurant.businessName}
                priority
                className="absolute inset-0 h-full w-full object-cover"
                fallbackClassName="bg-black/10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </div>
          ) : null}

          <div
            className={
              "mx-auto flex w-full max-w-[680px] flex-col items-center gap-2 px-4 text-center " +
              (restaurant.coverImageUrl ? "-mt-12" : "pt-8")
            }
          >
            {restaurant.logoUrl ? (
              <SmartImage
                src={restaurant.logoUrl}
                alt={restaurant.businessName}
                priority
                className="h-[clamp(64px,18vw,96px)] w-[clamp(64px,18vw,96px)] rounded-full border-4 object-cover"
                fallbackClassName="bg-black/10"
                style={{
                  borderColor: "var(--menu-card-bg)",
                  boxShadow: "var(--menu-shadow-card)",
                }}
              />
            ) : null}
            <h1
              className="font-bold leading-tight"
              style={{
                fontFamily: "var(--menu-font-heading)",
                fontSize: "var(--menu-size-heading)",
                color: "var(--menu-primary)",
              }}
            >
              {restaurant.businessName}
            </h1>
            {restaurant.address ? (
              <p className="opacity-70" style={{ fontSize: "calc(var(--menu-size-body) * 0.9)" }}>
                {restaurant.address}
              </p>
            ) : null}
            {restaurant.phone ? (
              <a
                href={`tel:${restaurant.phone}`}
                className="font-medium underline-offset-2 hover:underline"
                style={{ color: "var(--menu-accent)", fontSize: "calc(var(--menu-size-body) * 0.9)" }}
              >
                {restaurant.phone}
              </a>
            ) : null}
          </div>
        </header>

        {/* --- Menü içeriği: 2 katmanlı gezgin (kategori kartları → ürünler) --- */}
        <div className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-6">
          <MenuBrowser
            categories={categories}
            dishes={dishes}
            layout={layout}
            currency={restaurant.currency}
          />
        </div>
      </main>
    </>
  );
}
