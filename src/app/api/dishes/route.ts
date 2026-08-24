import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { PLANS, type PlanKey } from "@/lib/constants";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { dishCreateSchema } from "@/lib/validations/menu";

export const runtime = "nodejs";

// GET /api/dishes?categoryId= → { ok, dishes } (price string)
export const GET = apiHandler(async (req) => {
  const { menu } = await requireOwnerContext();

  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");

  const dishes = await prisma.dish.findMany({
    where: {
      menuId: menu.id,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });

  return ok({
    ok: true,
    dishes: dishes.map((d) => ({ ...d, price: d.price.toString() })),
  });
});

// POST /api/dishes { name, price, ... } → { ok, dish } | 403 limit
export const POST = apiHandler(async (req) => {
  const { menu, subscription, restaurant } = await requireOwnerContext();

  const body = await req.json().catch(() => null);
  const parsed = dishCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  const plan: PlanKey = subscription?.plan ?? "free_trial";
  const limit = PLANS[plan].maxDishes;
  if (limit >= 0) {
    const count = await prisma.dish.count({ where: { menuId: menu.id } });
    if (count >= limit) {
      return fail("Yemek limitine ulaştınız (planınızı yükseltin)", 403);
    }
  }

  // Kategori belirtildiyse bu menüye ait olduğunu doğrula.
  if (parsed.data.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, menuId: menu.id },
      select: { id: true },
    });
    if (!cat) return fail("Kategori bulunamadı", 404);
  }

  const sortOrder = await prisma.dish.count({ where: { menuId: menu.id } });

  const dish = await prisma.dish.create({
    data: {
      menuId: menu.id,
      categoryId: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl,
      thumbnailUrl: parsed.data.thumbnailUrl,
      originalImageUrl: parsed.data.originalImageUrl ?? null,
      isAvailable: parsed.data.isAvailable ?? true,
      sortOrder,
    },
  });

  revalidatePublicMenu(restaurant.slug);

  return ok({ ok: true, dish: { ...dish, price: dish.price.toString() } }, 201);
});
