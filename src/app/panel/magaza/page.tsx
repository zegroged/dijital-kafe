import { QrStore } from "@/components/panel/qr-store";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/services/payment";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const user = await requireUser();

  const [products, orders] = await Promise.all([
    prisma.qrProduct.findMany({
      where: { isActive: true },
      include: { vendor: { select: { companyName: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.qrOrder.findMany({
      where: { buyerUserId: user.id },
      include: {
        product: { select: { name: true } },
        vendor: { select: { companyName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    vendorName: p.vendor.companyName,
  }));

  const orderData = orders.map((o) => ({
    id: o.id,
    productName: o.product.name,
    vendorName: o.vendor.companyName,
    qty: o.qty,
    total: Number(o.total),
    status: o.status,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fiziksel QR</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Menünün QR kodunu lazer kazımalı bir ürün olarak sipariş et — masada
          şık dursun.
        </p>
      </div>
      <QrStore
        initialProducts={productData}
        initialOrders={orderData}
        paymentEnabled={getPaymentProvider().isConfigured()}
      />
    </div>
  );
}
