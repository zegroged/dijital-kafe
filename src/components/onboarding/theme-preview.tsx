"use client";

import { themeToCssVars } from "@/lib/theme/css";
import type { ThemeSettings } from "@/lib/theme/schema";

// Seçilen temanın küçük canlı önizlemesi (örnek bir yemek kartı).
export function ThemePreview({ theme }: { theme: ThemeSettings }) {
  const vars = themeToCssVars(theme);
  return (
    <div
      style={vars}
      className="overflow-hidden rounded-lg border"
    >
      <div
        style={{
          background: "var(--menu-decor), var(--menu-bg-css)",
          boxShadow: "var(--menu-frame)",
        }}
        className="p-4"
      >
        <p
          style={{
            color: "var(--menu-text)",
            fontFamily: "var(--menu-font-heading)",
            fontSize: "var(--menu-size-heading)",
          }}
          className="mb-3 leading-tight font-semibold"
        >
          Örnek Kategori
        </p>
        <div
          style={{
            background: "var(--menu-card-bg)",
            borderRadius: "var(--menu-radius-card)",
            border: "var(--menu-card-border)",
            boxShadow: "var(--menu-shadow-card), var(--menu-card-line)",
          }}
          className="flex items-center gap-3 p-3"
        >
          <div
            style={{ background: "var(--menu-primary)", opacity: 0.15 }}
            className="size-12 shrink-0 rounded-md"
          />
          <div className="min-w-0 flex-1">
            <p
              style={{
                color: "var(--menu-text)",
                fontFamily: "var(--menu-font-body)",
                fontSize: "var(--menu-size-body)",
              }}
              className="font-medium"
            >
              Türk Kahvesi
            </p>
            <p
              style={{
                color: "var(--menu-secondary)",
                fontFamily: "var(--menu-font-body)",
              }}
              className="text-xs"
            >
              Geleneksel, bol köpüklü
            </p>
          </div>
          <span
            style={{
              color: "var(--menu-primary)",
              fontFamily: "var(--menu-font-body)",
            }}
            className="text-sm font-semibold"
          >
            ₺45
          </span>
        </div>
      </div>
    </div>
  );
}
