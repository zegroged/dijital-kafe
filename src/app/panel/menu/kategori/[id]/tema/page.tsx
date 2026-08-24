import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeCustomizer } from "@/components/panel/theme/theme-customizer";
import { requireRestaurant, requireUser } from "@/lib/auth/session";
import type { PlanKey } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { parseTheme } from "@/lib/theme/schema";

export const dynamic = "force-dynamic";

// Kategoriye özel tema editörü — menü teması bölümünün aynısı, kategori hedefli.
export default async function CategoryThemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const restaurant = await requireRestaurant(user.id);
  const menu = restaurant.menu!;

  const category = await prisma.category.findFirst({
    where: { id, menuId: menu.id },
  });
  if (!category) notFound();

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  const plan = (subscription?.plan ?? "free_trial") as PlanKey;

  const menuTheme = parseTheme(menu.themeSettings);
  const hasOwnTheme = category.themeSettings != null;
  const initialTheme = hasOwnTheme
    ? parseTheme(category.themeSettings)
    : menuTheme;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/panel/menu"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ‹ Menüye dön
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          {category.icon ? `${category.icon} ` : ""}
          {category.name} · Tema
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasOwnTheme
            ? "Bu kategorinin kendi teması var. Düzenleyip kaydet."
            : "Menü temasından başlıyor. Kaydedince bu kategoriye özel olur."}
        </p>
      </div>

      <ThemeCustomizer
        initialTheme={initialTheme}
        target={{ kind: "category", categoryId: id, hasOwnTheme }}
        plan={plan}
      />
    </div>
  );
}
