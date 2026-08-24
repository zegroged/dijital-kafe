import type { PlanKey } from "@/lib/constants";
import { THEME_PRESETS, type ThemeSettings } from "@/lib/theme/schema";

// ============================================================
// TEMA YETKİLERİ — ARTIK TEK PLAN / TAM ERİŞİM.
// Eski paket kademesi (free/basic/premium tema kilidi + özel renk kilidi)
// KALDIRILDI: tüm temalar, tam renk spektrumu ve efektler herkese (deneme
// dahil) açık. Fonksiyonlar imza uyumu için duruyor; hepsi "izinli" döner.
// ============================================================

export type PresetTier = "free" | "basic" | "premium";

// Yalnız etiketleme/gruplama amaçlı (KİLİT DEĞİL).
const FREE_PRESET_KEYS = new Set<string>([
  "modern-kafe",
  "latte",
  "specialty",
  "pizzeria",
  "organik",
  "deniz",
  "kahvalti",
  "minimal",
  "modern-mono",
  "iskandinav",
]);

const BASIC_PRESET_KEYS = new Set<string>([
  "espresso",
  "koy-kahvesi",
  "kahve-kitap",
  "vintage-kafe",
  "italyan",
  "pastane",
  "firin",
  "dondurma",
  "burger-house",
  "diner",
  "napoli",
  "vegan",
  "smoothie",
  "salata",
  "balik",
  "meksika",
  "kebap",
  "lubnan",
  "cay-evi",
  "koy-kahvalti",
]);

export function presetTier(key: string): PresetTier {
  if (FREE_PRESET_KEYS.has(key)) return "free";
  if (BASIC_PRESET_KEYS.has(key)) return "basic";
  return "premium";
}

// Tüm temalar herkese açık.
export function isPresetAllowed(_plan: PlanKey, _key: string): boolean {
  return true;
}

// Tam renk spektrumu herkese açık.
export function isFullColorAllowed(_plan: PlanKey): boolean {
  return true;
}

export function allowedThemeCount(_plan: PlanKey): number {
  return THEME_PRESETS.length;
}

export type ThemeGate = { ok: true } | { ok: false; message: string };

// Sunucu kapısı: artık kısıtlama yok → her tema/renk kaydedilebilir.
export function assertThemeAllowedForPlan(
  _plan: PlanKey,
  _theme: ThemeSettings,
): ThemeGate {
  return { ok: true };
}
