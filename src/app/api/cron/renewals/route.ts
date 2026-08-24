import { apiHandler } from "@/lib/auth/guard";
import { type PlanKey } from "@/lib/constants";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { fulfillPackage } from "@/lib/payment/fulfill";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/cron/renewals  (header: x-internal-key: INTERNAL_API_KEY)
// Süresi dolan abonelikleri işler (cron'dan çağrılır):
//   • Deneme süresi bitti → expired (ödeme yapılmalı).
//   • Aktif + iptal edildi → dönem sonunda expired.
//   • Aktif + yenilenecek → otomatik yenile.
//       - mock ödeme: anında yenilenir (+30g) + (recurring komisyon yazılır).
//       - live (İyzico): saklı kartla recurring tahsilat GEREKİR (TODO; anahtar
//         + İyzico abonelik/recurring API'si gelince). Şimdilik expired bırakır.
export const POST = apiHandler(async (req) => {
  const key = req.headers.get("x-internal-key");
  if (!env.INTERNAL_API_KEY || key !== env.INTERNAL_API_KEY) {
    return fail("Yetkisiz", 401);
  }

  const now = new Date();
  let expired = 0;
  let renewed = 0;

  // 1) Süresi dolan denemeler → expired.
  const trials = await prisma.subscription.findMany({
    where: { status: "trialing", trialEndsAt: { lt: now } },
    select: { id: true },
  });
  if (trials.length) {
    await prisma.subscription.updateMany({
      where: { id: { in: trials.map((t) => t.id) } },
      data: { status: "expired" },
    });
    expired += trials.length;
  }

  // 2) Süresi dolan aktif abonelikler.
  const due = await prisma.subscription.findMany({
    where: { status: "active", currentPeriodEnd: { lt: now } },
    select: {
      id: true,
      userId: true,
      plan: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
    },
  });

  for (const s of due) {
    const canAutoCharge = env.PAYMENT_PROVIDER === "mock";
    if (s.cancelAtPeriodEnd || !canAutoCharge) {
      await prisma.subscription.update({
        where: { id: s.id },
        data: { status: "expired" },
      });
      expired += 1;
    } else {
      // Otomatik yenile (mock). paymentRef dönem bazlı → idempotent.
      const ref = `renew:${s.id}:${s.currentPeriodEnd?.toISOString() ?? ""}`;
      await fulfillPackage(s.userId, s.plan as PlanKey, ref);
      renewed += 1;
    }
  }

  return ok({ ok: true, expired, renewed });
});
