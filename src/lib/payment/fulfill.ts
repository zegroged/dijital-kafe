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

    const kazanc = {
      affiliateId: ref.affiliateId,
      referralId: ref.id,
      plan,
      amount,
      status: "earned" as const,
      paymentRef: paymentRef ?? null,
      earnedAt: now,
    };

    // Referansı "dönüştü" olarak ATOMİK işaretle. updateMany + status koşulu,
    // aynı satırı iki eşzamanlı çağrının birden kapamasını engeller: Postgres
    // UPDATE için satır kilidi alıp koşulu yeniden değerlendirir, dolayısıyla
    // count yalnızca birinde 1 döner. Aynı desen aşağıda fulfillQrOrder'da da var.
    const ilkOdeme =
      ref.status === "pending" &&
      (
        await tx.referral.updateMany({
          where: { id: ref.id, status: "pending" },
          data: { status: "earned", plan, earnedAt: now },
        })
      ).count === 1;

    if (ref.affiliate.commissionType === "one_time") {
      // Sadece ilk ödemede bir kez — ve "ilk" olan, referansı kapatmayı kazanan
      // çağrıdır. Önce count() sonra create() yarış açıyordu: eşzamanlı iki
      // callback de 0 görüp ikisi de kazanç yazabiliyordu.
      if (ilkOdeme) {
        await tx.commission.create({ data: kazanc });
      }
    } else {
      // recurring: her ödeme bir kazanç, ama aynı ödeme iki kez bildirilirse
      // bir kez. Tekilliği commissions(referral_id, payment_ref) benzersiz
      // indeksi sağlıyor; skipDuplicates bunu ON CONFLICT DO NOTHING'e çevirir.
      // Not: P2002'yi try/catch ile yakalamak burada İŞE YARAMAZ — Postgres'te
      // hata alan işlem bütünüyle iptal olur, JS tarafında yakalamak kurtarmaz.
      // payment_ref yoksa indeks devreye girmez (NULL'lar farklı sayılır) ve
      // eski davranış korunur: her çağrı bir kazanç yazar.
      await tx.commission.createMany({ data: [kazanc], skipDuplicates: true });
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
