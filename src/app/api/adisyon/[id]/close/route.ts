import { recalcAdisyonTotal } from "@/lib/adisyon";
import { apiHandler, requireRestaurantActor } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ paymentMethod: z.enum(["cash", "card"]) });

// POST /api/adisyon/:id/close { paymentMethod } → adisyonu kapat (paid)
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { restaurantId, userId } = await requireRestaurantActor();
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Ödeme türü seçilmedi");

    const exists = await prisma.adisyon.findFirst({
      where: { id, restaurantId },
      select: { id: true },
    });
    if (!exists) return fail("Adisyon bulunamadı", 404);

    // Toplamı kalemlerden tazele, sonra atomik kapat (yalnız açıksa).
    await recalcAdisyonTotal(id);
    const res = await prisma.adisyon.updateMany({
      where: { id, restaurantId, status: "open" },
      data: {
        status: "paid",
        paymentMethod: parsed.data.paymentMethod,
        closedById: userId,
        closedAt: new Date(),
      },
    });
    if (res.count !== 1) return fail("Adisyon zaten kapalı", 409);
    return ok({ ok: true });
  },
);
