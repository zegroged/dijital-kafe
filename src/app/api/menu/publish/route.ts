import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const publishSchema = z.object({
  publish: z.boolean(),
});

// POST /api/menu/publish { publish } → { ok, isPublished }
export const POST = apiHandler(async (req) => {
  const { menu, restaurant } = await requireOwnerContext();

  const body = await req.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  const { publish } = parsed.data;

  const updated = await prisma.menu.update({
    where: { id: menu.id },
    data: {
      isPublished: publish,
      // Yayınlarken zaman damgası bas; yayından alırken mevcut değeri koru.
      ...(publish ? { publishedAt: new Date() } : {}),
    },
    select: { isPublished: true },
  });

  // Public menü cache'ini tazele → yayın/yayından alma anında yansır.
  revalidatePublicMenu(restaurant.slug);

  return ok({ ok: true, isPublished: updated.isPublished });
});
