"use client";

import { googleFontsHref, themeToCssVars } from "@/lib/theme/css";
import type { ThemeSettings } from "@/lib/theme/schema";

// Canlı önizleme: theme'den CSS değişkenleri üretir, örnek menü kartlarını
// font/renk/radius/shadow/layout/button stilleriyle gösterir.

const SAMPLE_DISHES = [
  {
    name: "Truffle Risotto",
    description: "Mantar, parmesan ve taze otlarla hazırlanmış kremalı risotto.",
    price: "320,00",
  },
  {
    name: "Izgara Somon",
    description: "Limonlu tereyağı sos ve mevsim sebzeleriyle.",
    price: "480,00",
  },
  {
    name: "Çikolatalı Sufle",
    description: "Sıcak çikolata dolgulu, vanilyalı dondurma eşliğinde.",
    price: "180,00",
  },
];

function buttonStyle(theme: ThemeSettings): React.CSSProperties {
  const variant = theme.button_style.variant;
  const base: React.CSSProperties = {
    borderRadius: "var(--menu-radius-btn)",
    fontFamily: "var(--menu-font-body)",
    fontWeight: 600,
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "opacity 0.15s",
    border: "1.5px solid var(--menu-primary)",
  };
  if (variant === "filled") {
    return { ...base, background: "var(--menu-primary)", color: "#fff" };
  }
  if (variant === "outline") {
    return { ...base, background: "transparent", color: "var(--menu-primary)" };
  }
  // ghost
  return {
    ...base,
    background: "transparent",
    color: "var(--menu-primary)",
    border: "1.5px solid transparent",
  };
}

export function ThemePreview({ theme }: { theme: ThemeSettings }) {
  const vars = themeToCssVars(theme);
  const isList = theme.card_style.layout === "list";
  const fontsHref = googleFontsHref(theme);

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Önizleme için fontları yükle. */}
      <link rel="stylesheet" href={fontsHref} />

      <div
        style={{
          ...vars,
          background: "var(--menu-decor), var(--menu-bg-css)",
          boxShadow: "var(--menu-frame)",
        }}
        className="min-h-[480px] p-5"
      >
        {/* Başlık */}
        <header className="mb-5 text-center">
          <h2
            style={{
              fontFamily: "var(--menu-font-heading)",
              color: "var(--menu-text)",
              fontSize: "var(--menu-size-heading)",
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Lezzet Durağı
          </h2>
          <p
            style={{
              fontFamily: "var(--menu-font-body)",
              color: "var(--menu-secondary)",
              fontSize: "var(--menu-size-body)",
              marginTop: "0.25rem",
            }}
          >
            Şefin önerileri
          </p>
        </header>

        {/* Kartlar */}
        <div
          className={isList ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}
        >
          {SAMPLE_DISHES.map((dish, i) => (
            <article
              key={dish.name}
              style={{
                background: "var(--menu-card-bg)",
                borderRadius: "var(--menu-radius-card)",
                border: "var(--menu-card-border)",
                boxShadow: "var(--menu-shadow-card), var(--menu-card-line)",
                overflow: "hidden",
              }}
              className={isList ? "flex items-stretch" : "flex flex-col"}
            >
              {/* Görsel yer tutucu */}
              <div
                style={{
                  background: `color-mix(in oklch, var(--menu-primary) ${
                    18 + i * 12
                  }%, var(--menu-card-bg))`,
                }}
                className={
                  isList
                    ? "w-20 shrink-0"
                    : "aspect-[4/3] w-full"
                }
              />
              <div className="flex flex-1 flex-col gap-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    style={{
                      fontFamily: "var(--menu-font-heading)",
                      color: "var(--menu-text)",
                      fontSize: "calc(var(--menu-size-body) * 1.1)",
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {dish.name}
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--menu-font-body)",
                      color: "var(--menu-primary)",
                      fontSize: "var(--menu-size-body)",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dish.price} ₺
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--menu-font-body)",
                    color: "var(--menu-secondary)",
                    fontSize: "calc(var(--menu-size-body) * 0.9)",
                    lineHeight: 1.4,
                    opacity: 0.85,
                  }}
                >
                  {dish.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Buton örneği */}
        <div className="mt-5 flex justify-center">
          <button type="button" style={buttonStyle(theme)} tabIndex={-1}>
            Sipariş Ver
          </button>
        </div>
      </div>
    </div>
  );
}
