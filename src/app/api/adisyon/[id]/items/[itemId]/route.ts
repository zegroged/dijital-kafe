import { recalcAdisyonTotal } from "@/lib/adisyon";
import { apiHandler, requireRestaurantActor } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// DELETE /api/adisyon/:id/items/:itemId → kalemi sil
export const DELETE = apiHandler<{
  params: Promise<{ id: string; itemId: string }>;
}>(async (_req, ctx) => {
  const { restaurantId } = await requireRestaurantActor();
  const { id, itemId } = await ctx.params;

  const adisyon = await prisma.adisyon.findFirst({
    where: { id, restaurantId },
    select: { id: true, status: true },
  });
  if (!adisyon) return fail("Adisyon bulunamadı", 404);
  if (adisyon.status !== "open") return fail("Adisyon kapalı", 409);

  const res = await prisma.adisyonItem.deleteMany({
    where: { id: itemId, adisyonId: adisyon.id },
  });
  if (res.count !== 1) return fail("Kalem bulunamadı", 404);

  const total = await recalcAdisyonTotal(adisyon.id);
  return ok({ ok: true, total });
});
