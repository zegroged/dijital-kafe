import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/tables/:id → adı/aktifliği güncelle
export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Geçersiz veri");
    const res = await prisma.restaurantTable.updateMany({
      where: { id, restaurantId: restaurant.id },
      data: parsed.data,
    });
    if (res.count !== 1) return fail("Masa bulunamadı", 404);
    return ok({ ok: true });
  },
);

// DELETE /api/tables/:id → masayı sil (açık adisyonu varsa engelle)
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    const openCount = await prisma.adisyon.count({
      where: { tableId: id, restaurantId: restaurant.id, status: "open" },
    });
    if (openCount > 0) {
      return fail("Bu masada açık adisyon var, önce kapat.", 409);
    }
    const res = await prisma.restaurantTable.deleteMany({
      where: { id, restaurantId: restaurant.id },
    });
    if (res.count !== 1) return fail("Masa bulunamadı", 404);
    return ok({ ok: true });
  },
);
