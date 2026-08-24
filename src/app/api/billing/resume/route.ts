import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/billing/resume → otomatik yenilemeyi tekrar aç.
export const POST = apiHandler(async () => {
  const { userId } = await requireOwnerContext();
  await prisma.subscription.updateMany({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });
  return ok({ ok: true });
});
