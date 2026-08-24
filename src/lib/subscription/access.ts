import { PLANS } from "@/lib/constants";
import type { Subscription } from "@/generated/prisma/client";

// ============================================================
// Abonelik erişim kapısı.
// Public menü her yüklemede runtime'da kontrol edilir (cron yerine).
// ============================================================

export type MenuAccess =
  | { visible: true }
  | { visible: false; reason: "trial_expired" | "subscription_expired" };

// Menü müşteriye görünür mü? (Aboneliğe + trial bitişine göre)
export function getMenuAccess(
  sub: Subscription | null,
  now: Date = new Date(),
): MenuAccess {
  if (!sub) return { visible: false, reason: "subscription_expired" };

  if (sub.status === "trialing") {
    if (sub.trialEndsAt && sub.trialEndsAt < now) {
      return { visible: false, reason: "trial_expired" };
    }
    return { visible: true };
  }

  if (sub.status === "active") {
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
      return { visible: false, reason: "subscription_expired" };
    }
    return { visible: true };
  }

  // expired | cancelled
  return { visible: false, reason: "subscription_expired" };
}

// 3D model kotası dolmuş mu?
export function canCreateModel(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.modelsUsed < sub.model3dQuota;
}

export function remainingModelQuota(sub: Subscription | null): number {
  if (!sub) return 0;
  return Math.max(0, sub.model3dQuota - sub.modelsUsed);
}

// --- AI fotoğraf canlandırma (Nano Banana) kotası — yuvarlanan 30 günlük döngü ---
// aiEnhanceResetAt geçtiyse (veya hiç başlamadıysa) dönem sıfırlanmış sayılır.
// Cron gerektirmez: kullanım anında değerlendirilir.

export type EnhanceState = {
  quota: number; // plana göre aylık hak
  used: number; // bu dönemde kullanılan
  remaining: number;
  canEnhance: boolean;
  periodExpired: boolean; // dönem dolmuş → bir sonraki kullanımda sıfırla
};

export function enhanceState(
  sub: Subscription | null,
  now: Date = new Date(),
): EnhanceState {
  if (!sub) {
    return { quota: 0, used: 0, remaining: 0, canEnhance: false, periodExpired: true };
  }
  const quota = PLANS[sub.plan].aiEnhanceQuota;
  const periodExpired = !sub.aiEnhanceResetAt || sub.aiEnhanceResetAt <= now;
  const used = periodExpired ? 0 : sub.aiEnhancementsUsed;
  const remaining = Math.max(0, quota - used);
  return { quota, used, remaining, canEnhance: remaining > 0, periodExpired };
}

export function canEnhanceImage(
  sub: Subscription | null,
  now: Date = new Date(),
): boolean {
  return enhanceState(sub, now).canEnhance;
}

export function remainingEnhanceQuota(
  sub: Subscription | null,
  now: Date = new Date(),
): number {
  return enhanceState(sub, now).remaining;
}

// 30 günlük döngü süresi (ms).
export const ENHANCE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
