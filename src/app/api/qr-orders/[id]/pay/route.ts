import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { ROOT_DOMAIN } from "@/lib/constants";
import { fail, getClientIp, ok } from "@/lib/http";
import { fulfillQrOrder } from "@/lib/payment/fulfill";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/services/payment";

export const runtime = "nodejs";

// POST /api/qr-orders/:id/pay → ödeme başlat
// mock → anında paid; live → İyzico checkout URL döner.
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { userId, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;

    const provider = getPaymentProvider();
    if (!provider.isConfigured()) {
      return fail("Ödeme henüz aktif değil", 409);
    }

    const order = await prisma.qrOrder.findFirst({
      where: { id, buyerUserId: userId },
      include: { product: { select: { name: true } } },
    });
    if (!order) return fail("Sipariş bulunamadı", 404);
    if (order.status !== "pending") return fail("Bu sipariş zaten işlendi", 409);

    const result = await provider.createCheckout({
      purpose: "qr_order",
      refId: order.id,
      amount: Number(order.total),
      description: order.product.name,
      buyer: {
        id: userId,
        email: restaurant.user.email ?? "",
        name: order.shippingName ?? restaurant.user.name ?? restaurant.businessName,
        ip: getClientIp(req),
        phone: order.shippingPhone ?? restaurant.phone ?? undefined,
      },
      address: {
        contactName: order.shippingName ?? restaurant.businessName,
        address: order.shippingAddress ?? undefined,
      },
      callbackUrl: `https://${ROOT_DOMAIN}/api/payment/callback`,
    });

    if (result.paid) {
      await fulfillQrOrder(order.id, "mock");
      return ok({ ok: true, status: "paid" });
    }
    return ok({ ok: true, checkoutUrl: result.checkoutUrl, token: result.token });
  },
);
