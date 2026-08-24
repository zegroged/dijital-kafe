import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { PLANS, type PlanKey } from "@/lib/constants";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { categoryCreateSchema } from "@/lib/validations/menu";

export const runtime = "nodejs";

// GET /api/categories → { ok, categories } (sortOrder asc)
export const GET = apiHandler(async () => {
  const { menu } = await requireOwnerContext();

  const categories = await prisma.category.findMany({
    where: { menuId: menu.id },
    orderBy: { sortOrder: "asc" },
  });

  return ok({ ok: true, categories });
});

// POST /api/categories { name, icon? } → { ok, category } | 403 limit
export const POST = apiHandler(async (req) => {
  const { menu, subscription, restaurant } = await requireOwnerContext();

  const body = await req.json().catch(() => null);
  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  const plan: PlanKey = subscription?.plan ?? "free_trial";
  const limit = PLANS[plan].maxCategories;
  if (limit >= 0) {
    const count = await prisma.category.count({ where: { menuId: menu.id } });
    if (count >= limit) {
      return fail(
        "Kategori limitine ulaştınız (planınızı yükseltin)",
        403,
      );
    }
  }

  const sortOrder = await prisma.category.count({ where: { menuId: menu.id } });

  const category = await prisma.category.create({
    data: {
      menuId: menu.id,
      name: parsed.data.name,
      icon: parsed.data.icon,
      imageUrl: parsed.data.imageUrl,
      sortOrder,
    },
  });

  revalidatePublicMenu(restaurant.slug);

  return ok({ ok: true, category }, 201);
});
