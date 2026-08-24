import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({ isActive: z.boolean() });

// PATCH /api/staff/:id { isActive } → çalışanı aktif/pasif et
export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Geçersiz veri");
    const res = await prisma.staff.updateMany({
      where: { id, restaurantId: restaurant.id },
      data: { isActive: parsed.data.isActive },
    });
    if (res.count !== 1) return fail("Çalışan bulunamadı", 404);
    return ok({ ok: true });
  },
);

// DELETE /api/staff/:id → çalışan hesabını sil (kullanıcı + profil)
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    const staff = await prisma.staff.findFirst({
      where: { id, restaurantId: restaurant.id },
      select: { userId: true },
    });
    if (!staff) return fail("Çalışan bulunamadı", 404);
    // User silinince Staff cascade ile gider. Adisyon geçmişi (opened_by_id) kalır.
    await prisma.user.delete({ where: { id: staff.userId } });
    return ok({ ok: true });
  },
);
