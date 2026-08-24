"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { DishCard } from "@/components/menu/dish-card";
import { SmartImage } from "@/components/ui/smart-image";
import type { PublicCategory, PublicDish } from "@/components/menu/types";
import { backgroundCss, themeToCssVars } from "@/lib/theme/css";
import type { ThemeSettings } from "@/lib/theme/schema";

// İki katmanlı public menü gezgini:
//   1) Kategori kartları (2'şerli grid) → 2) seçilen kategorinin ürünleri.
// Her kategori, menü teması bölümündeki gibi KENDİ tam temasına sahip olabilir.

type Props = {
  categories: PublicCategory[];
  dishes: PublicDish[];
  layout: "grid" | "list";
  currency: string;
};

type Group = {
  id: string;
  name: string;
  icon: string | null;
  imageUrl: string | null;
  theme: ThemeSettings | null;
  dishes: PublicDish[];
};

const OTHER_ID = "__other";

export function MenuBrowser({ categories, dishes, layout, currency }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const groups = useMemo<Group[]>(() => {
    const byCat = new Map<string | null, PublicDish[]>();
    for (const d of dishes) {
      const k = d.categoryId ?? null;
      const arr = byCat.get(k);
      if (arr) arr.push(d);
      else byCat.set(k, [d]);
    }
    const result: Group[] = [];
    for (const c of categories) {
      const ds = byCat.get(c.id);
      if (ds && ds.length) {
        result.push({
          id: c.id,
          name: c.name,
          icon: c.icon,
          imageUrl: c.imageUrl,
          theme: c.theme,
          dishes: ds,
        });
      }
    }
    const unc = byCat.get(null);
    if (unc && unc.length) {
      result.push({
        id: OTHER_ID,
        name: "Diğer",
        icon: null,
        imageUrl: null,
        theme: null,
        dishes: unc,
      });
    }
    return result;
  }, [categories, dishes]);

  const active = activeId ? groups.find((g) => g.id === activeId) : null;

  function open(id: string) {
    setActiveId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }
  function back() {
    setActiveId(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  if (groups.length === 0) {
    return (
      <p className="py-16 text-center opacity-60">
        Bu menüde henüz ürün bulunmuyor.
      </p>
    );
  }

  // --- 2. katman: seçilen kategorinin ürünleri ---
  if (active) {
    const ct = active.theme;
    // Kategorinin kendi teması varsa o görünüme tüm tema değişkenlerini + arka planı uygula.
    const detailStyle: CSSProperties | undefined = ct
      ? {
          ...themeToCssVars(ct),
          background: "var(--menu-decor), var(--menu-bg-css)",
          boxShadow: "var(--menu-frame)",
          color: "var(--menu-text)",
        }
      : undefined;
    const effLayout = ct ? ct.card_style.layout : layout;

    return (
      <div
        key={active.id}
        style={detailStyle}
        className={
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 duration-300 ease-out" +
          (ct ? " -mx-2 rounded-2xl p-4 sm:p-5" : "")
        }
      >
        <button
          type="button"
          onClick={back}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{
            color: "var(--menu-primary)",
            fontFamily: "var(--menu-font-body)",
          }}
        >
          <span aria-hidden>←</span> Tüm kategoriler
        </button>

        <h2
          className="mb-4 flex items-center gap-2 font-semibold"
          style={{
            fontFamily: "var(--menu-font-heading)",
            fontSize: "calc(var(--menu-size-heading) * 0.78)",
            color: "var(--menu-text)",
          }}
        >
          {active.icon ? <span aria-hidden>{active.icon}</span> : null}
          {active.name}
        </h2>

        <div
          className={
            effLayout === "grid"
              ? "grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-3"
              : "flex flex-col gap-3"
          }
        >
          {active.dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              layout={effLayout}
              currency={currency}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- 1. katman: kategori kartları (2'şerli grid) ---
  return (
    <div
      key="root"
      className="grid grid-cols-2 gap-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 duration-300 ease-out"
    >
      {groups.map((g) => {
        const accent = g.theme?.colors.primary ?? "var(--menu-primary)";
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => open(g.id)}
            className="group relative flex aspect-[4/3] flex-col overflow-hidden text-left transition-transform active:scale-[0.98]"
            style={{
              borderRadius: "var(--menu-radius-card)",
              border: "var(--menu-card-border)",
              boxShadow: "var(--menu-shadow-card), var(--menu-card-line)",
              background: "var(--menu-card-bg)",
            }}
          >
            {g.imageUrl ? (
              <>
                <SmartImage
                  src={g.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  fallbackClassName="bg-black/5"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              </>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `color-mix(in oklch, ${accent} 22%, var(--menu-card-bg))`,
                }}
              >
                {g.icon ? (
                  <span
                    aria-hidden
                    style={{ fontSize: "2.25rem", opacity: 0.9 }}
                  >
                    {g.icon}
                  </span>
                ) : null}
              </div>
            )}

            <div className="relative mt-auto flex items-end justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {g.imageUrl && g.icon ? (
                    <span aria-hidden style={{ color: "#fff" }}>
                      {g.icon}
                    </span>
                  ) : null}
                  <span
                    className="truncate font-semibold"
                    style={{
                      fontFamily: "var(--menu-font-heading)",
                      color: g.imageUrl ? "#fff" : "var(--menu-text)",
                      fontSize: "calc(var(--menu-size-body) * 1.08)",
                    }}
                  >
                    {g.name}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{
                    color: g.imageUrl
                      ? "rgba(255,255,255,0.85)"
                      : "var(--menu-secondary)",
                  }}
                >
                  {g.dishes.length} ürün
                </span>
              </div>
            </div>

            {/* Kategorinin kendi teması varsa → alt aksan çizgisi (kategori rengi) */}
            {g.theme ? (
              <div
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ background: g.theme.colors.primary }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
