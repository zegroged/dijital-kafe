import { z } from "zod";

export const emailSchema = z.email("Geçerli bir e-posta girin").toLowerCase();

// TR cep telefonunu kanonik forma çevirir: "05XXXXXXXXX" (11 hane). Geçersizse null.
// Kabul: 5XXXXXXXXX, 05XXXXXXXXX, +905XXXXXXXXX, 905XXXXXXXXX, boşluk/tire/parantezli.
export function normalizePhone(raw: string): string | null {
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("90") && n.length === 12) n = n.slice(2);
  if (n.length === 10 && n.startsWith("5")) n = "0" + n;
  return /^05\d{9}$/.test(n) ? n : null;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => normalizePhone(s) ?? s)
  .pipe(
    z.string().regex(/^05\d{9}$/, "Geçerli bir telefon girin (05XX XXX XX XX)"),
  );

// E-posta'da @ var; telefonda yok → girişte ayırt etmek için.
export const isEmailLike = (s: string) => s.includes("@");

// bcrypt 72 byte sınırı: max 72.
export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(72, "Şifre en fazla 72 karakter olabilir");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().max(120).optional(),
  businessName: z
    .string()
    .trim()
    .min(2, "İşletme adı en az 2 karakter olmalı")
    .max(120, "İşletme adı çok uzun"),
  // Seçilen paket (OPEN_MEMBERSHIP açıkken ödemesiz uygulanır; yoksa free_trial).
  plan: z.enum(["free_trial", "basic", "premium"]).optional(),
  // Komisyoncu referans kodu. Ücretsiz denemede OPSİYONEL; paralı paket
  // seçilirse ZORUNLU (register.ts plana göre uygular). Verilirse geçerli +
  // aktif olmalı (sunucu doğrular).
  ref: z.string().trim().max(40).optional(),
});

// Giriş: e-posta VEYA telefon (identifier) + şifre.
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "E-posta veya telefon gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
