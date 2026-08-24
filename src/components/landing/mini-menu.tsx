import { themeToCssVars } from "@/lib/theme/css";
import type { ThemeSettings } from "@/lib/theme/schema";

// Bir temayla render edilmiş GERÇEK küçük menü önizlemesi.
// Landing'de hem hero telefonu hem tema galerisi bunu kullanır → ürünün
// gerçek çıktısını canlı gösterir (saf/sunucu bileşeni, JS gerektirmez).

type Item = { name: string; price: string };

const SAMPLE_ITEMS: Item[] = [
  { name: "Türk Kahvesi", price: "₺45" },
  { name: "Cheesecake", price: "₺120" },
  { name: "Limonata", price: "₺60" },
];

export function MiniMenu({
  theme,
  name = "Menü",
  items = SAMPLE_ITEMS,
  className,
}: {
  theme: ThemeSettings;
  name?: string;
  items?: Item[];
  className?: string;
}) {
  return (
    <div
      style={{
        ...themeToCssVars(theme),
        background: "var(--menu-decor), var(--menu-bg-css)",
        boxShadow: "var(--menu-frame)",
      }}
      className={`flex h-full flex-col gap-2 p-3.5 ${className ?? ""}`}
    >
      <div
        style={{
          fontFamily: "var(--menu-font-heading)",
          color: "var(--menu-primary)",
        }}
        className="text-sm font-bold leading-none"
      >
        {name}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        {items.map((it) => (
          <div
            key={it.name}
            style={{
              background: "var(--menu-card-bg)",
              borderRadius: "var(--menu-radius-card)",
              border: "var(--menu-card-border)",
              boxShadow: "var(--menu-shadow-card), var(--menu-card-line)",
            }}
            className="flex items-center justify-between gap-2 px-2.5 py-2"
          >
            <span
              style={{
                fontFamily: "var(--menu-font-body)",
                color: "var(--menu-text)",
              }}
              className="truncate text-[0.7rem] font-medium"
            >
              {it.name}
            </span>
            <span
              style={{ color: "var(--menu-primary)" }}
              className="shrink-0 text-[0.7rem] font-bold tabular-nums"
            >
              {it.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
