import { PLANS, type PlanKey, TRIAL_DAYS } from "@/lib/constants";
import { env, integrations } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { normalizeSlug, validateSlug } from "@/lib/validations/slug";
import { hashPassword } from "./password";

export type RegisterResult =
  | { ok: true; userId: string; slug: string }
  | { ok: false; error: string; field?: "email" | "slug" | "ref" | "form" };

// Boş bir subdomain bulana kadar -1, -2 ... ekler.
async function findAvailableSlug(base: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const candidate = normalizeSlug(`${base}-${i}`);
    const exists = await prisma.restaurant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return normalizeSlug(`${base}-${Date.now()}`);
}

// Hesap + restoran + boş menü + varsayılan kategori + trial aboneliği (tek create).
export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri",
      field: "form",
    };
  }
  const { email, password, name, businessName } = parsed.data;
  const suggested =
    typeof (input as { slug?: unknown }).slug === "string"
      ? (input as { slug: string }).slug
      : "";

  // slug: verilmişse onu, yoksa işletme adından türet
  let slug = normalizeSlug(suggested || businessName);
  if (!validateSlug(slug).valid) {
    slug = await findAvailableSlug(normalizeSlug(businessName) || "menu");
  }

  // Referans kodu: ücretsiz denemede OPSİYONEL, paralı paket seçilirse ZORUNLU.
  // Verilirse mevcut ve AKTİF (komisyoncu e-postası onaylı) olmalı. Kodlar büyük
  // harf saklanır → girişi normalize et.
  const requestedPlan = parsed.data.plan ?? "free_trial";
  const isPaidSelection =
    requestedPlan === "basic" || requestedPlan === "premium";
  const refCode = parsed.data.ref?.trim().toUpperCase() ?? "";

  if (isPaidSelection && !refCode) {
    return {
      ok: false,
      error:
        "Paralı paket için referans kodu gerekli. Kodunuz yoksa info@dijitalkafe.com adresine yazın.",
      field: "ref",
    };
  }

  let affiliate: { id: string } | null = null;
  if (refCode) {
    const found = await prisma.affiliate.findUnique({
      where: { code: refCode },
      select: { id: true, user: { select: { emailVerified: true } } },
    });
    if (!found) {
      return {
        ok: false,
        error: "Geçersiz referans kodu. Komisyoncunuzdan doğru kodu alın.",
        field: "ref",
      };
    }
    if (!found.user.emailVerified) {
      return {
        ok: false,
        error:
          "Bu referans kodu henüz aktif değil (komisyoncu e-postasını onaylamamış).",
        field: "ref",
      };
    }
    affiliate = { id: found.id };
  }

  // benzersizlik
  const [emailExists, slugExists] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.restaurant.findUnique({ where: { slug }, select: { id: true } }),
  ]);
  if (emailExists) {
    return { ok: false, error: "Bu e-posta zaten kayıtlı", field: "email" };
  }
  if (slugExists) {
    slug = await findAvailableSlug(slug);
  }

  const passwordHash = await hashPassword(password);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);

  // Ödeme altyapısı gelene kadar: OPEN_MEMBERSHIP açıksa seçilen ücretli paket
  // ÖDEMESİZ + süresiz aktif açılır. Aksi halde herkes 14 günlük free_trial.
  const openMembership = env.OPEN_MEMBERSHIP === "true";
  const plan: PlanKey =
    openMembership && (requestedPlan === "basic" || requestedPlan === "premium")
      ? requestedPlan
      : "free_trial";
  const subscriptionCreate =
    plan === "free_trial"
      ? {
          trialEndsAt,
          currentPeriodEnd: trialEndsAt,
          model3dQuota: PLANS.free_trial.model3dQuota,
        }
      : {
          plan,
          status: "active" as const,
          trialEndsAt: null,
          currentPeriodEnd: null, // süresiz (ödeme öncesi)
          model3dQuota: PLANS[plan].model3dQuota,
        };

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
      // Resend yoksa otomatik doğrula (yerel geliştirme); varsa doğrulama bekler.
      emailVerified: integrations.resend() ? null : new Date(),
      subscription: {
        create: subscriptionCreate,
      },
      restaurant: {
        create: {
          businessName,
          slug,
          menu: {
            create: {
              categories: { create: { name: "Ana Yemekler", sortOrder: 0 } },
            },
          },
        },
      },
      // Referans verildiyse bekleyen komisyon kaydı (ödeme yapılınca "earned").
      ...(affiliate
        ? { referredBy: { create: { affiliateId: affiliate.id } } }
        : {}),
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id, slug };
}
