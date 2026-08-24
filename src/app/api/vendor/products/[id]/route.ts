import { apiHandler, requireVendorContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { qrProductUpdateSchema } from "@/lib/validations/qr";

export const runtime = "nodejs";

// Ürünün bu üreticiye ait olduğunu doğrula.
async function assertOwn(productId: string, vendorId: string) {
  const p = await prisma.qrProduct.findFirst({
    where: { id: productId, vendorId },
    select: { id: true },
  });
  return Boolean(p);
}

// PATCH /api/vendor/products/:id
export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { vendor } = await requireVendorContext();
    const { id } = await ctx.params;
    if (!(await assertOwn(id, vendor.id))) return fail("Ürün bulunamadı", 404);

    const body = await req.json().catch(() => null);
    const parsed = qrProductUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
    }
    const product = await prisma.qrProduct.update({
      where: { id },
      data: parsed.data,
    });
    return ok({ ok: true, product: { ...product, price: product.price.toString() } });
  },
);

// DELETE /api/vendor/products/:id (siparişi olan ürün silinemez → pasifle)
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { vendor } = await requireVendorContext();
    const { id } = await ctx.params;
    if (!(await assertOwn(id, vendor.id))) return fail("Ürün bulunamadı", 404);

    const orderCount = await prisma.qrOrder.count({ where: { productId: id } });
    if (orderCount > 0) {
      // Geçmiş siparişler için kaydı koru; sadece pasifle.
      await prisma.qrProduct.update({ where: { id }, data: { isActive: false } });
      return ok({ ok: true, deactivated: true });
    }
    await prisma.qrProduct.delete({ where: { id } });
    return ok({ ok: true, deactivated: false });
  },
);
