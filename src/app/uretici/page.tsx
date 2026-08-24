import { ChangePassword } from "@/components/account/change-password";
import { PortalShell } from "@/components/portal-shell";
import { VendorPanel } from "@/components/vendor/vendor-panel";
import { requireVendor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VendorPage() {
  const { vendor } = await requireVendor();

  const [products, orders] = await Promise.all([
    prisma.qrProduct.findMany({
      where: { vendorId: vendor.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.qrOrder.findMany({
      where: { vendorId: vendor.id },
      include: {
        product: { select: { name: true } },
        buyer: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    isActive: p.isActive,
  }));

  const orderData = orders.map((o) => ({
    id: o.id,
    productName: o.product.name,
    buyerEmail: o.buyer.email ?? "",
    qty: o.qty,
    total: Number(o.total),
    vendorPayout: Number(o.vendorPayout),
    status: o.status,
    shippingName: o.shippingName,
    shippingPhone: o.shippingPhone,
    shippingAddress: o.shippingAddress,
    menuQrUrl: o.menuQrUrl,
  }));

  return (
    <PortalShell label="QR Üretici">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">{vendor.companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ürünlerini yönet, gelen siparişleri işle/kargola. Platform her
            satıştan %10 pay alır; kalan sana aittir.
          </p>
        </div>

        <VendorPanel
          initialProducts={productData}
          initialOrders={orderData}
        />

        <ChangePassword />
      </div>
    </PortalShell>
  );
}
