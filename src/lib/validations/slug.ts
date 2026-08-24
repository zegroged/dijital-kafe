import { RESERVED_SLUGS } from "@/lib/constants";

export const SLUG_MIN = 3;
export const SLUG_MAX = 32;
// küçük harf/rakam ile başla-bit, arada tire olabilir, 3-32 karakter
export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

// "Kahve Dünyası" -> "kahve-dunyasi"
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[çğıİöşü]/g, (c) => TR_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-") // geçersizleri (boşluk, aksan vb.) tireye çevir
    .replace(/-+/g, "-") // tekrar eden tireleri sadeleştir
    .replace(/^-+|-+$/g, "") // baş/son tireleri at
    .slice(0, SLUG_MAX);
}

export interface SlugCheck {
  valid: boolean;
  error?: string;
}

// Biçim + rezerve kontrolü (benzersizlik DB'de ayrıca kontrol edilir).
export function validateSlug(slug: string): SlugCheck {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    return {
      valid: false,
      error: `Adres ${SLUG_MIN}-${SLUG_MAX} karakter olmalı`,
    };
  }
  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error: "Sadece küçük harf, rakam ve tire kullanılabilir",
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { valid: false, error: "Bu adres kullanılamaz" };
  }
  return { valid: true };
}
