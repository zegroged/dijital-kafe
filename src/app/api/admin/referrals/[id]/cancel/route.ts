import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/admin/referrals/:id/cancel
// Bir referans ilişkisini DURDUR/SÜRDÜR (toggle). Durdurulunca yeni (özellikle
// recurring) komisyon yazılmaz; zaten hak edilmiş komisyonlar etkilenmez.
// Sürdürülürse: kazanç varsa 'earned', yoksa 'pending'e döner.
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    await requireAdminContext();
    const { id } = await ctx.params;

    const ref = await prisma.referral.findUnique({
      where: { id },
      select: { id: true, status: true, _count: { select: { commissions: true } } },
    });
    if (!ref) return fail("Referans bulunamadı", 404);

    let nextStatus: "cancelled" | "earned" | "pending";
    if (ref.status === "cancelled") {
      nextStatus = ref._count.commissions > 0 ? "earned" : "pending";
    } else {
      nextStatus = "cancelled";
    }

    await prisma.referral.update({
      where: { id },
      data: { status: nextStatus },
    });

    return ok({ ok: true, status: nextStatus });
  },
);
