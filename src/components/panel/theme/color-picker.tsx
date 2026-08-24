"use client";

import { PipetteIcon } from "lucide-react";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { PALETTES } from "@/lib/theme/schema";
import { cn } from "@/lib/utils";

// Paletlerdeki tüm renkleri hızlı seçim için topla (tekrarsız).
const QUICK_COLORS = Array.from(
  new Set(
    PALETTES.flatMap((p) => [p.primary, p.secondary, p.background]).map((c) =>
      c.toUpperCase(),
    ),
  ),
);

// Tam spektrum (milyonlarca ton) renk seçici. Kutuya basınca spektrum açılır.
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const valid = /^#([0-9a-fA-F]{6})$/.test(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Tıklanabilir renk kutusu → spektrumu açar/kapatır */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "size-9 shrink-0 rounded-md border transition-transform hover:scale-105",
            !valid && "border-destructive",
          )}
          style={{ background: valid ? value : "#FFFFFF" }}
          aria-label="Renk seçiciyi aç"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          spellCheck={false}
          className={cn(
            "h-9 w-28 rounded-md border bg-transparent px-2.5 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            !valid && "border-destructive",
          )}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PipetteIcon className="size-3.5" />
          {open ? "Kapat" : "Renk seç"}
        </button>
      </div>

      {open && (
        <div className="space-y-2 rounded-lg border bg-card p-2.5">
          <HexColorPicker
            color={valid ? value : "#000000"}
            onChange={(c) => onChange(c.toUpperCase())}
            style={{ width: "100%", height: 170 }}
          />
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              Hızlı renkler
            </div>
            <div className="grid grid-cols-10 gap-1">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => onChange(c)}
                  className="aspect-square rounded border border-black/10 transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
