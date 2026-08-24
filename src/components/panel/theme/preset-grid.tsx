"use client";

import { LockIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { PlanKey } from "@/lib/constants";
import { googleFontsHrefMulti, themeToCssVars } from "@/lib/theme/css";
import { isPresetAllowed, presetTier } from "@/lib/theme/entitlements";
import {
  presetGroup,
  type ThemeGroup,
  THEME_GROUPS,
  THEME_PRESETS,
  type ThemePreset,
  type ThemeSettings,
} from "@/lib/theme/schema";
import { cn } from "@/lib/utils";

// Hazır görsel şablonlar: her kart, o temayla render edilmiş küçük bir menü
// önizlemesi gösterir. Paket kademesinin üstündekiler GÖSTERİLİR ama kilitlidir
// (kilit ikonu) — tıklanınca uygulanmaz, yükseltme uyarısı çıkar.

const FONTS_HREF = googleFontsHrefMulti(
  THEME_PRESETS.flatMap((p) => [p.theme.font.heading, p.theme.font.body]),
);

const TIER_LABEL: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
};

function clone(t: ThemeSettings): ThemeSettings {
  return JSON.parse(JSON.stringify(t));
}

function PresetCard({
  preset,
  active,
  locked,
  onSelect,
}: {
  preset: ThemePreset;
  active: boolean;
  locked: boolean;
  onSelect: (theme: ThemeSettings) => void;
}) {
  const t = preset.theme;
  const tierLabel = TIER_LABEL[presetTier(preset.key)] ?? "Premium";

  function handleClick() {
    if (locked) {
      toast.info(`"${preset.name}" ${tierLabel} pakete özel. Yükselterek kullanabilirsiniz.`);
      return;
    }
    onSelect(clone(t));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-disabled={locked}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 text-left transition-all hover:shadow-md",
        active ? "border-primary ring-2 ring-ring/40" : "border-border",
        locked && "cursor-not-allowed",
      )}
    >
      {/* Mini menü önizlemesi (gerçek tema) */}
      <div
        style={{
          ...themeToCssVars(t),
          background: "var(--menu-decor), var(--menu-bg-css)",
          boxShadow: "var(--menu-frame)",
        }}
        className="flex aspect-[4/3] flex-col gap-1.5 p-3"
      >
        <div
          style={{
            fontFamily: "var(--menu-font-heading)",
            color: "var(--menu-primary)",
            fontSize: "0.72rem",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Menü
        </div>
        <div
          style={{
            background: "var(--menu-card-bg)",
            borderRadius: "var(--menu-radius-card)",
            border: "var(--menu-card-border)",
            boxShadow: "var(--menu-shadow-card), var(--menu-card-line)",
          }}
          className="flex flex-1 flex-col gap-1 p-2"
        >
          <div
            style={{
              height: 6,
              width: "55%",
              background: "var(--menu-primary)",
              borderRadius: 3,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              fontFamily: "var(--menu-font-heading)",
              color: "var(--menu-text)",
              fontSize: "0.6rem",
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            Örnek Ürün
          </div>
          <div
            style={{
              fontFamily: "var(--menu-font-body)",
              color: "var(--menu-secondary)",
              fontSize: "0.5rem",
              opacity: 0.8,
              lineHeight: 1.1,
            }}
          >
            kısa açıklama
          </div>
          <div
            style={{
              fontFamily: "var(--menu-font-body)",
              color: "var(--menu-primary)",
              fontSize: "0.6rem",
              fontWeight: 700,
              marginTop: "auto",
            }}
          >
            ₺120
          </div>
        </div>
      </div>

      {/* Kilit katmanı */}
      {locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/55 backdrop-blur-[1.5px] transition-opacity">
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground/85 text-background">
            <LockIcon className="size-4" />
          </div>
          <span className="rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-semibold text-background">
            {tierLabel}
          </span>
        </div>
      ) : null}

      {/* Etiket */}
      <div className="bg-card px-2.5 py-2">
        <div className="flex items-center gap-1 text-xs font-semibold">
          {locked ? <LockIcon className="size-3 text-muted-foreground" /> : null}
          <span className="truncate">{preset.name}</span>
        </div>
        <div className="truncate text-[10px] text-muted-foreground">
          {preset.desc}
        </div>
      </div>
    </button>
  );
}

export function PresetGrid({
  activeKey,
  plan,
  onSelect,
}: {
  activeKey?: string;
  plan: PlanKey;
  onSelect: (theme: ThemeSettings) => void;
}) {
  // Şablonları 3 gruba ayır (sonsuz scroll yerine sekme).
  const grouped = useMemo(() => {
    const map: Record<ThemeGroup, ThemePreset[]> = {
      beyaz: [],
      premium: [],
      sik: [],
    };
    for (const p of THEME_PRESETS) map[presetGroup(p)].push(p);
    return map;
  }, []);

  // Açılışta, seçili temanın grubunu göster (yoksa ilk grup).
  const activePreset = activeKey
    ? THEME_PRESETS.find((p) => p.key === activeKey)
    : undefined;
  const defaultTab: ThemeGroup = activePreset
    ? presetGroup(activePreset)
    : THEME_GROUPS[0].key;

  return (
    <>
      <link rel="stylesheet" href={FONTS_HREF} />
      <Tabs defaultValue={defaultTab} className="gap-3">
        <TabsList className="w-full">
          {THEME_GROUPS.map((g) => (
            <TabsTrigger key={g.key} value={g.key} className="gap-1">
              {g.label}
              <span className="text-xs opacity-50">
                {grouped[g.key].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {THEME_GROUPS.map((g) => (
          <TabsContent key={g.key} value={g.key}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {grouped[g.key].map((p) => (
                <PresetCard
                  key={p.key}
                  preset={p}
                  active={activeKey === p.key}
                  locked={!isPresetAllowed(plan, p.key)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
