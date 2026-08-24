import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { QR_PLATFORM_FEE_RATE, ROOT_DOMAIN } from "@/lib/constants";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { qrOrderCreateSchema } from "@/lib/validations/qr";

export const runtime = "nodejs";

const round2 = (n: number) => Math.round(n * 100) / 100;

function serialize(o: {
  unitPrice: unknown;
  total: unknown;
  platformFee: unknown;
  vendorPayout: unknown;
}) {
  return {
    ...o,
    unitPrice: String(o.unitPrice),
    total: String(o.total),
    platformFee: String(o.platformFee),
    vendorPayout: String(o.vendorPayout),
  };
}

// GET /api/qr-orders → sahibin QR siparişleri
export const GET = apiHandler(async () => {
  const { userId } = await requireOwnerContext();
  const orders = await prisma.qrOrder.findMany({
    where: { buyerUserId: userId },
    include: {
      product: { select: { name: true } },
      vendor: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok({ ok: true, orders: orders.map(serialize) });
});

// POST /api/qr-orders { productId, qty, shipping* } → sipariş oluştur (pending)
// Not: ödeme (İyzico) gelince pending→paid olup üretici paneline düşer.
export const POST = apiHandler(async (req) => {
  const { userId, restaurant } = await requireOwnerContext();
  const body = await req.json().catch(() => null);
  const parsed = qrOrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  const product = await prisma.qrProduct.findFirst({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true, vendorId: true, price: true },
  });
  if (!product) return fail("Ürün bulunamadı veya pasif", 404);

  const qty = parsed.data.qty;
  const unit = Number(product.price);
  const total = round2(unit * qty);
  const platformFee = round2(total * QR_PLATFORM_FEE_RATE);
  const vendorPayout = round2(total - platformFee);
  const menuQrUrl = restaurant.slug
    ? `https://${restaurant.slug}.${ROOT_DOMAIN}`
    : null;

  const order = await prisma.qrOrder.create({
    data: {
      vendorId: product.vendorId,
      productId: product.id,
      buyerUserId: userId,
      qty,
      unitPrice: unit,
      total,
      platformFee,
      vendorPayout,
      menuQrUrl,
      shippingName: parsed.data.shippingName,
      shippingPhone: parsed.data.shippingPhone,
      shippingAddress: parsed.data.shippingAddress,
      status: "pending",
    },
  });

  return ok({ ok: true, order: serialize(order) }, 201);
});
