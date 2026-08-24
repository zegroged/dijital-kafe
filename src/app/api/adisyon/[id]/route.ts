import { apiHandler, requireRestaurantActor } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/adisyon/:id → adisyon detayı (kalemler + masa)
export const GET = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { restaurantId } = await requireRestaurantActor();
    const { id } = await ctx.params;
    const adisyon = await prisma.adisyon.findFirst({
      where: { id, restaurantId },
      include: {
        table: { select: { name: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!adisyon) return fail("Adisyon bulunamadı", 404);
    return ok({ ok: true, adisyon });
  },
);
