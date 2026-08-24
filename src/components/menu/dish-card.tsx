"use client";

import { useState } from "react";
import { ModelViewerModal } from "@/components/menu/model-viewer-modal";
import { SmartImage } from "@/components/ui/smart-image";
import type { PublicDish } from "@/components/menu/types";

// Tek yemek kartı. Hem grid hem list düzeninde kullanılır.
// "3D'de Gör" yalnızca model hazırsa görünür ve tıklanınca modalı açar
// (model-viewer ancak o an yüklenir).

type Props = {
  dish: PublicDish;
  layout: "grid" | "list";
  currency: string;
};

// Geçersiz ISO-4217 currency kodu Intl'de RangeError fırlatır → TRY'ye düş.
function formatPrice(value: number, currency: string): string {
  const make = (cur: string) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur });
  try {
    return make(currency || "TRY").format(value);
  } catch {
    return make("TRY").format(value);
  }
}

export function DishCard({ dish, layout, currency }: Props) {
  const [open, setOpen] = useState(false);
  const image = dish.thumbnailUrl || dish.imageUrl;
  const isList = layout === "list";
  // Intl.NumberFormat serialize edilemez; bu yüzden currency string'i prop alıp
  // formatlayıcıyı client'ta kuruyoruz. Geçersiz currency kodu RangeError
  // fırlatıp tüm menüyü çökertmesin diye TRY'ye düşülür.
  const price = formatPrice(dish.price, currency);

  return (
    <article
      className={
        isList
          ? "flex gap-3 overflow-hidden p-3"
          : "flex flex-col overflow-hidden"
      }
      style={{
        backgroundColor: "var(--menu-card-bg)",
        borderRadius: "var(--menu-radius-card)",
        border: "var(--menu-card-border)",
        boxShadow: "var(--menu-shadow-card), var(--menu-card-line)",
      }}
    >
      {image ? (
        <div
          className={
            isList
              ? "relative aspect-square w-[clamp(64px,22vw,104px)] shrink-0 overflow-hidden"
              : "relative aspect-[4/3] w-full overflow-hidden"
          }
          style={{ borderRadius: "var(--menu-radius-card)" }}
        >
          {/* next/image yerine SmartImage: yemek görselleri remotePatterns dışında
              olabilir; fade-in + kırık görsel yedeği + doğru lazy yükleme sağlar. */}
          <SmartImage
            src={image}
            alt={dish.name}
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="bg-black/5"
          />
        </div>
      ) : null}

      <div
        className={
          isList
            ? "flex min-w-0 flex-1 flex-col justify-center gap-1"
            : "flex flex-1 flex-col gap-1 p-3"
        }
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-w-0 font-semibold leading-tight"
            style={{
              fontFamily: "var(--menu-font-heading)",
              fontSize: "calc(var(--menu-size-body) * 1.05)",
              color: "var(--menu-text)",
            }}
          >
            {dish.name}
          </h3>
          <span
            className="shrink-0 font-semibold tabular-nums"
            style={{
              color: "var(--menu-primary)",
              fontSize: "var(--menu-size-body)",
            }}
          >
            {price}
          </span>
        </div>

        {dish.description ? (
          <p
            className="opacity-70"
            style={{
              fontSize: "calc(var(--menu-size-body) * 0.9)",
              color: "var(--menu-text)",
            }}
          >
            {dish.description}
          </p>
        ) : null}

        {dish.hasModel && dish.model3dUrl ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 inline-flex w-fit items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--menu-primary)",
              color: "var(--menu-card-bg)",
              borderRadius: "var(--menu-radius-btn)",
            }}
          >
            <span aria-hidden>📦</span>
            3D&apos;de Gör
          </button>
        ) : null}
      </div>

      {dish.hasModel && dish.model3dUrl ? (
        <ModelViewerModal
          open={open}
          onOpenChange={setOpen}
          name={dish.name}
          glbUrl={dish.model3dUrl}
          usdzUrl={dish.modelUsdzUrl}
          posterUrl={dish.imageUrl}
        />
      ) : null}
    </article>
  );
}
