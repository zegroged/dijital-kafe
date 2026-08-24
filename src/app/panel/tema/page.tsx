import { requireRestaurant, requireUser } from "@/lib/auth/session";
import type { PlanKey } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { parseTheme } from "@/lib/theme/schema";
import { ThemeCustomizer } from "@/components/panel/theme/theme-customizer";

// Tema sayfası: sunucudan mevcut temayı okur, customizer'a başlangıç değeri
// olarak geçer. Tüm düzenleme client tarafında local state'te yapılır;
// "Kaydet" basılana kadar hiçbir değişiklik kalıcı olmaz.
export default async function ThemePage() {
  const user = await requireUser();
  const restaurant = await requireRestaurant(user.id);
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  const plan = (subscription?.plan ?? "free_trial") as PlanKey;
  const theme = parseTheme(restaurant.menu!.themeSettings);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tema</h1>
        <p className="mt-1 text-muted-foreground">
          Menünün görünümünü özelleştir. Değişiklikler canlı önizlemede görünür;
          kaydetmeden kalıcı olmaz.
        </p>
      </div>

      <ThemeCustomizer initialTheme={theme} plan={plan} />
    </div>
  );
}
