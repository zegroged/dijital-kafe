import { apiHandler, requireVendorContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { qrOrderStatusSchema } from "@/lib/validations/qr";

export const runtime = "nodejs";

// PATCH /api/vendor/orders/:id { status } → sipariş durumunu ilerlet
export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { vendor } = await requireVendorContext();
    const { id } = await ctx.params;

    const order = await prisma.qrOrder.findFirst({
      where: { id, vendorId: vendor.id },
      select: { id: true, status: true },
    });
    if (!order) return fail("Sipariş bulunamadı", 404);

    const body = await req.json().catch(() => null);
    const parsed = qrOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz durum");
    }

    if (order.status === "pending") {
      return fail("Ödeme bekleyen sipariş işlenemez", 409);
    }
    if (order.status === "delivered" || order.status === "cancelled") {
      return fail("Bu sipariş kapanmış", 409);
    }

    await prisma.qrOrder.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return ok({ ok: true, status: parsed.data.status });
  },
);
