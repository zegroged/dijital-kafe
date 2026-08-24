"use client";

import { cn } from "@/lib/utils";
import { ColorPicker } from "./color-picker";

// Customizer için küçük, yeniden kullanılabilir kontrol parçaları.

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

// Tek seçimli segment kontrolü (enum alanları için).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Tekil renk seçici: tam spektrum (HSV) + hex + hızlı paletler (popover).
export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <ColorPicker value={value} onChange={onChange} />;
}
