import { MIN_WITHDRAWAL_TRY } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getPayoutProvider } from "@/lib/services/payout";
import { computeWithholding, getWithholdingRate, round2 } from "./calc";

// Çekim akışı hataları (API tarafında HTTP koduna çevrilir).
export class WithdrawalError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "WithdrawalError";
  }
}

const OPEN_STATUSES = ["requested", "approved", "processing"] as const;

function isP2002(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2002"
  );
}

// Komisyoncu TÜM çekilebilir bakiyesi için çekim talebi açar (earned → requested).
export async function createWithdrawal(affiliateId: string) {
  const rate = await getWithholdingRate();
  try {
    return await prisma.$transaction(async (tx) => {
      const aff = await tx.affiliate.findUnique({ where: { id: affiliateId } });
      if (!aff) throw new WithdrawalError(404, "Komisyoncu bulunamadı");

      const open = await tx.withdrawalRequest.findFirst({
        where: { affiliateId, status: { in: [...OPEN_STATUSES] } },
        select: { id: true },
      });
      if (open) {
        throw new WithdrawalError(409, "Zaten bekleyen bir çekim talebin var.");
      }

      const payout = (aff.payoutInfo ?? {}) as { iban?: string; holder?: string };
      if (!payout.iban || !payout.holder) {
        throw new WithdrawalError(400, "Önce IBAN/ödeme bilgilerini doldur.");
      }
      if (aff.taxStatus === "tax_registered" && !aff.taxDocUrl) {
        throw new WithdrawalError(
          400,
          "Vergi mükellefi olarak önce vergi levhanı yüklemelisin.",
        );
      }

      const earned = await tx.commission.findMany({
        where: { affiliateId, status: "earned" },
        select: { id: true, amount: true },
      });
      const gross = round2(earned.reduce((s, c) => s + Number(c.amount), 0));
      if (gross < MIN_WITHDRAWAL_TRY) {
        throw new WithdrawalError(
          400,
          `Çekim için en az ${MIN_WITHDRAWAL_TRY} TL gerekir. Çekilebilir bakiye: ${gross} TL.`,
        );
      }

      const w = computeWithholding(gross, aff.taxStatus, rate);

      const req = await tx.withdrawalRequest.create({
        data: {
          affiliateId,
          status: "requested",
          grossAmount: gross,
          taxStatus: aff.taxStatus,
          withholdingRate: w.rate,
          withholdingAmount: w.withholding,
          netAmount: w.net,
          ibanSnapshot: payout.iban,
          holderSnapshot: payout.holder,
          taxDocUrlSnapshot: aff.taxDocUrl,
          items: {
            create: earned.map((c) => ({ commissionId: c.id, amount: c.amount })),
          },
        },
      });

      // Komisyonları talebe kilitle.
      await tx.commission.updateMany({
        where: { id: { in: earned.map((c) => c.id) } },
        data: { status: "requested" },
      });

      return req;
    });
  } catch (e) {
    // Eşzamanlı talep yarışı: partial unique index P2002 → graceful 409.
    if (isP2002(e)) {
      throw new WithdrawalError(409, "Zaten bekleyen bir çekim talebin var.");
    }
    throw e;
  }
}

// Komisyoncu kendi talebini iptal eder (yalnız henüz onaylanmadıysa).
export async function cancelWithdrawal(affiliateId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.withdrawalRequest.findFirst({
      where: { id, affiliateId },
      include: { items: { select: { commissionId: true } } },
    });
    if (!req) throw new WithdrawalError(404, "Talep bulunamadı");
    if (req.status !== "requested") {
      throw new WithdrawalError(409, "Bu talep artık iptal edilemez.");
    }
    // Kilitli komisyonları çekilebilir bakiyeye geri ver.
    await tx.commission.updateMany({
      where: {
        id: { in: req.items.map((i) => i.commissionId) },
        status: "requested",
      },
      data: { status: "earned" },
    });
    await tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: "rejected",
        rejectReason: "Komisyoncu iptal etti",
        rejectedAt: new Date(),
      },
    });
  });
}

// Admin: talebi onaylar (requested → approved).
export async function approveWithdrawal(id: string) {
  const res = await prisma.withdrawalRequest.updateMany({
    where: { id, status: "requested" },
    data: { status: "approved", approvedAt: new Date() },
  });
  if (res.count !== 1) {
    throw new WithdrawalError(409, "Talep onaylanamadı (durum uygun değil).");
  }
}

// Admin: talebi reddeder (komisyonlar bakiyeye döner). requested/approved'ten.
export async function rejectWithdrawal(id: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.withdrawalRequest.findUnique({
      where: { id },
      include: { items: { select: { commissionId: true } } },
    });
    if (!req) throw new WithdrawalError(404, "Talep bulunamadı");
    if (req.status !== "requested" && req.status !== "approved") {
      throw new WithdrawalError(409, "Bu talep reddedilemez.");
    }
    await tx.commission.updateMany({
      where: {
        id: { in: req.items.map((i) => i.commissionId) },
        status: "requested",
      },
      data: { status: "earned" },
    });
    await tx.withdrawalRequest.update({
      where: { id },
      data: { status: "rejected", rejectReason: reason, rejectedAt: new Date() },
    });
  });
}

// Admin: crash sonucu "processing"te asılı kalmış talebi onaya geri al (yeniden
// ödenebilir). NOT: gerçek-para async sağlayıcı (papara live) açılınca, önce para
// gerçekten gitmediğinin teyidi gerekir (çift ödeme riski). manual/mock'ta güvenli.
export async function recoverProcessing(id: string) {
  const res = await prisma.withdrawalRequest.updateMany({
    where: { id, status: "processing" },
    data: { status: "approved" },
  });
  if (res.count !== 1) {
    throw new WithdrawalError(409, "Bu talep 'gönderiliyor' durumunda değil.");
  }
}

// Admin: onaylanmış talebi öder. Çift ödemeyi önlemek için sendPayout'tan ÖNCE
// atomik "claim" (approved→processing) yapılır; yalnız tek çağrı kazanır.
export async function payWithdrawal(id: string) {
  const existing = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!existing) throw new WithdrawalError(404, "Talep bulunamadı");
  if (existing.status === "paid") {
    return { paid: true, ref: existing.paymentRef ?? undefined };
  }

  // ATOMİK SAHİPLENME: yalnız bir çağrı approved→processing geçişini kazanır.
  const claim = await prisma.withdrawalRequest.updateMany({
    where: { id, status: "approved" },
    data: { status: "processing" },
  });
  if (claim.count !== 1) {
    throw new WithdrawalError(409, "Talep zaten işleniyor veya onaylı değil.");
  }

  const req = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!req) throw new WithdrawalError(404, "Talep bulunamadı");

  let result: Awaited<ReturnType<ReturnType<typeof getPayoutProvider>["sendPayout"]>>;
  try {
    result = await getPayoutProvider().sendPayout({
      withdrawalId: req.id,
      amount: Number(req.netAmount),
      holder: req.holderSnapshot ?? "",
      iban: req.ibanSnapshot ?? "",
      description: `KAFE komisyon ödemesi ${req.id.slice(0, 8)}`,
    });
  } catch (e) {
    console.error("[payout] sağlayıcı hatası:", e);
    // Sahiplenmeyi geri al → tekrar denenebilir.
    await prisma.withdrawalRequest.updateMany({
      where: { id, status: "processing" },
      data: { status: "approved" },
    });
    throw new WithdrawalError(502, "Ödeme gönderilemedi, tekrar deneyin.");
  }

  if (result.paid) {
    await markWithdrawalPaid(req.id, result.ref);
    return result;
  }

  // Asenkron payout (processing) için webhook/verify yolu henüz yok → şimdilik
  // desteklenmiyor; "zombi" talep / para riski olmasın diye sahiplenmeyi geri al.
  await prisma.withdrawalRequest.updateMany({
    where: { id, status: "processing" },
    data: { status: "approved" },
  });
  throw new WithdrawalError(
    501,
    "Asenkron payout henüz desteklenmiyor; sağlayıcı anlık sonuç dönmeli.",
  );
}

// Ödeme kesinleşince: komisyonlar withdrawn + talep paid. Idempotent (CAS).
export async function markWithdrawalPaid(id: string, ref?: string) {
  await prisma.$transaction(async (tx) => {
    const req = await tx.withdrawalRequest.findUnique({
      where: { id },
      include: { items: { select: { commissionId: true } } },
    });
    if (!req) return;
    const now = new Date();
    // Yalnız paid değilse paid'e geç (eşzamanlı çağrıda çift işlem yok).
    const res = await tx.withdrawalRequest.updateMany({
      where: { id, status: { not: "paid" } },
      data: { status: "paid", paidAt: now, paymentRef: ref ?? req.paymentRef ?? null },
    });
    if (res.count === 0) return;
    await tx.commission.updateMany({
      where: {
        id: { in: req.items.map((i) => i.commissionId) },
        status: "requested",
      },
      data: { status: "withdrawn", paidAt: now },
    });
  });
}
