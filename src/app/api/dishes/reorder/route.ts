import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { reorderSchema } from "@/lib/validations/menu";

export const runtime = "nodejs";

// PATCH /api/dishes/reorder { ids } → { ok }
export const PATCH = apiHandler(async (req) => {
  const { menu, restaurant } = await requireOwnerContext();

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  // Sadece bu menüye ait id'leri sırala.
  const owned = await prisma.dish.findMany({
    where: { id: { in: parsed.data.ids }, menuId: menu.id },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((d) => d.id));
  const ids = parsed.data.ids.filter((id) => ownedIds.has(id));

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.dish.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePublicMenu(restaurant.slug);

  return ok({ ok: true });
});
