import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import type { PlanKey } from "@/lib/constants";
import { fail, ok } from "@/lib/http";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { assertThemeAllowedForPlan } from "@/lib/theme/entitlements";
import { parseTheme, themeSchema } from "@/lib/theme/schema";

// GET /api/theme → { ok:true, theme }
// Giriş yapan sahibin menüsünün tema ayarlarını döndürür (eksikleri tamamlar).
export const GET = apiHandler(async () => {
  const { menu } = await requireOwnerContext();
  const theme = parseTheme(menu.themeSettings);
  return ok({ ok: true, theme });
});

// PATCH /api/theme  { theme: ThemeSettings } → { ok:true, theme }
// Gelen temayı themeSchema ile doğrular/tamamlar, menü ayarlarını günceller.
export const PATCH = apiHandler(async (req: Request) => {
  const { menu, restaurant, subscription } = await requireOwnerContext();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Geçersiz istek gövdesi");
  }

  const input = (body as { theme?: unknown })?.theme;
  const parsed = themeSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Geçersiz tema";
    return fail(message, 400);
  }

  // Paket kilidi: kilitli tema / özel renk kaçağını engelle (UI baypası dahil).
  const plan = (subscription?.plan ?? "free_trial") as PlanKey;
  const gate = assertThemeAllowedForPlan(plan, parsed.data);
  if (!gate.ok) return fail(gate.message, 403);

  await prisma.menu.update({
    where: { id: menu.id },
    data: { themeSettings: parsed.data },
  });

  revalidatePublicMenu(restaurant.slug);

  return ok({ ok: true, theme: parsed.data });
});
