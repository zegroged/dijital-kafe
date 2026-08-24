import {
  apiHandler,
  assertDishInMenu,
  requireOwnerContext,
} from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { dishUpdateSchema } from "@/lib/validations/menu";

export const runtime = "nodejs";

// PATCH /api/dishes/:id { partial } → { ok, dish }
export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { menu, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertDishInMenu(id, menu.id);

    const body = await req.json().catch(() => null);
    const parsed = dishUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
    }

    // Kategori değişiyorsa bu menüye ait olduğunu doğrula.
    if (parsed.data.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, menuId: menu.id },
        select: { id: true },
      });
      if (!cat) return fail("Kategori bulunamadı", 404);
    }

    const dish = await prisma.dish.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePublicMenu(restaurant.slug);

    return ok({ ok: true, dish: { ...dish, price: dish.price.toString() } });
  },
);

// DELETE /api/dishes/:id → { ok }
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { menu, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertDishInMenu(id, menu.id);

    await prisma.dish.delete({ where: { id } });

    revalidatePublicMenu(restaurant.slug);

    return ok({ ok: true });
  },
);
