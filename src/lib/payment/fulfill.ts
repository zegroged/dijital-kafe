import { PLANS, type PlanKey } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Paket ödemesi başarılı → aboneliği aktif et + komisyoncuya kazanç yaz.
//   one_time  → referans başına BİR KEZ (oran genelde %70).
//   recurring → HER ödemede bir kazanç (oran genelde %30); müşteri aboneliğini
//               bırakınca yeni ödeme olmaz → kazanç doğal olarak durur.
// Idempotent çağrılabilir: one_time tek kayıt garantili; recurring'de aynı ödeme
// (paymentRef) iki kez gelirse tekrar yazılmaz.
export async function fulfillPackage(
  userId: string,
  plan: PlanKey,
  paymentRef?: string,
) {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + PERIOD_MS);
  const price = PLANS[plan].priceMonthly;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { userId },
      data: {
        plan,
        status: "active",
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false, // ödeme/yenileme iptali geri alır
        model3dQuota: PLANS[plan].model3dQuota,
      },
    });

    const ref = await tx.referral.findUnique({
      where: { referredUserId: userId },
      include: { affiliate: true },
    });
    // Referans yoksa ya da admin komisyonu DURDURDUYSA: abonelik açılır ama
    // komisyon yazılmaz (recurring'i manuel kesme yolu).
    if (!ref || ref.status === "cancelled") return;

    const rate = Number(ref.affiliate.commissionRate);
    const amount = round2(price * rate);

    if (ref.affiliate.commissionType === "one_time") {
      // Sadece ilk ödemede bir kez.
      const already = await tx.commission.count({ where: { referralId: ref.id } });
      if (already === 0) {
        await tx.commission.create({
          data: {
            affiliateId: ref.affiliateId,
            referralId: ref.id,
            plan,
            amount,
            status: "earned",
            paymentRef: paymentRef ?? null,
            earnedAt: now,
          },
        });
      }
    } else {
      // recurring: her ödeme bir kazanç. Aynı ödeme tekrar gelirse atla.
      const dup = paymentRef
        ? await tx.commission.count({
            where: { referralId: ref.id, paymentRef },
          })
        : 0;
      if (dup === 0) {
        await tx.commission.create({
          data: {
            affiliateId: ref.affiliateId,
            referralId: ref.id,
            plan,
            amount,
            status: "earned",
            paymentRef: paymentRef ?? null,
            earnedAt: now,
          },
        });
      }
    }

    // Referansı "dönüştü" olarak işaretle (ilk ödemede).
    if (ref.status === "pending") {
      await tx.referral.update({
        where: { id: ref.id },
        data: { status: "earned", plan, earnedAt: now },
      });
    }
  });
}

// QR sipariş ödemesi başarılı → pending→paid (üretici paneline düşer). Idempotent.
export async function fulfillQrOrder(
  orderId: string,
  paymentRef?: string,
): Promise<boolean> {
  const res = await prisma.qrOrder.updateMany({
    where: { id: orderId, status: "pending" },
    data: { status: "paid", paymentRef: paymentRef ?? null },
  });
  return res.count === 1;
}
