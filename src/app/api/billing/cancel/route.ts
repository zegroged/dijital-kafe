import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/billing/cancel → otomatik yenilemeyi kapat (dönem sonuna kadar erişir).
export const POST = apiHandler(async () => {
  const { userId } = await requireOwnerContext();
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true },
  });
  if (!sub) return fail("Abonelik bulunamadı", 404);
  if (sub.status !== "active" && sub.status !== "trialing") {
    return fail("İptal edilecek aktif abonelik yok", 409);
  }
  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });
  return ok({ ok: true });
});
