import { recalcAdisyonTotal } from "@/lib/adisyon";
import { apiHandler, requireRestaurantActor } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  dishId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(99).default(1),
});

// POST /api/adisyon/:id/items { dishId, qty } → menüden ürün ekle
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { restaurantId } = await requireRestaurantActor();
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Geçersiz ürün");

    const adisyon = await prisma.adisyon.findFirst({
      where: { id, restaurantId },
      select: { id: true, status: true },
    });
    if (!adisyon) return fail("Adisyon bulunamadı", 404);
    if (adisyon.status !== "open") return fail("Adisyon kapalı", 409);

    const dish = await prisma.dish.findFirst({
      where: { id: parsed.data.dishId, menu: { restaurantId } },
      select: { id: true, name: true, price: true },
    });
    if (!dish) return fail("Ürün bulunamadı", 404);

    await prisma.adisyonItem.create({
      data: {
        adisyonId: adisyon.id,
        dishId: dish.id,
        name: dish.name,
        unitPrice: dish.price,
        qty: parsed.data.qty,
      },
    });
    const total = await recalcAdisyonTotal(adisyon.id);
    return ok({ ok: true, total }, 201);
  },
);
