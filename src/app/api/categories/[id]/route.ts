import { Prisma } from "@/generated/prisma/client";
import {
  apiHandler,
  assertCategoryInMenu,
  requireOwnerContext,
} from "@/lib/auth/guard";
import type { PlanKey } from "@/lib/constants";
import { fail, ok } from "@/lib/http";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { assertThemeAllowedForPlan } from "@/lib/theme/entitlements";
import { themeSchema } from "@/lib/theme/schema";
import { categoryUpdateSchema } from "@/lib/validations/menu";

export const runtime = "nodejs";

// PATCH /api/categories/:id { name?, icon?, imageUrl?, themeSettings? }
// themeSettings: tam tema objesi → kategoriye özel tema; null → menü temasını miras al.
export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const { menu, restaurant, subscription } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertCategoryInMenu(id, menu.id);

    const body = await req.json().catch(() => null);
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
    }

    const data: Prisma.CategoryUpdateInput = { ...parsed.data };

    // Kategori teması ayrı işlenir.
    if (body && typeof body === "object" && "themeSettings" in body) {
      const raw = (body as { themeSettings: unknown }).themeSettings;
      if (raw === null) {
        data.themeSettings = Prisma.DbNull; // menü temasını miras al
      } else {
        const t = themeSchema.safeParse(raw);
        if (!t.success) return fail("Geçersiz tema");
        const plan = (subscription?.plan ?? "free_trial") as PlanKey;
        const gate = assertThemeAllowedForPlan(plan, t.data);
        if (!gate.ok) return fail(gate.message, 403);
        data.themeSettings = t.data;
      }
    }

    const category = await prisma.category.update({ where: { id }, data });
    revalidatePublicMenu(restaurant.slug);
    return ok({ ok: true, category });
  },
);

// DELETE /api/categories/:id → { ok }
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { menu, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertCategoryInMenu(id, menu.id);

    await prisma.category.delete({ where: { id } });

    revalidatePublicMenu(restaurant.slug);

    return ok({ ok: true });
  },
);
