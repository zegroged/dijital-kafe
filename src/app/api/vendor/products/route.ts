import { apiHandler, requireVendorContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { qrProductCreateSchema } from "@/lib/validations/qr";

export const runtime = "nodejs";

// GET /api/vendor/products → üreticinin ürünleri
export const GET = apiHandler(async () => {
  const { vendor } = await requireVendorContext();
  const products = await prisma.qrProduct.findMany({
    where: { vendorId: vendor.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return ok({
    ok: true,
    products: products.map((p) => ({ ...p, price: p.price.toString() })),
  });
});

// POST /api/vendor/products → yeni ürün
export const POST = apiHandler(async (req) => {
  const { vendor } = await requireVendorContext();
  const body = await req.json().catch(() => null);
  const parsed = qrProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const sortOrder = await prisma.qrProduct.count({
    where: { vendorId: vendor.id },
  });
  const product = await prisma.qrProduct.create({
    data: {
      vendorId: vendor.id,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl,
      isActive: parsed.data.isActive ?? true,
      sortOrder,
    },
  });
  return ok({ ok: true, product: { ...product, price: product.price.toString() } }, 201);
});
