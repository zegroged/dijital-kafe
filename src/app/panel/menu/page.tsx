import { requireRestaurant, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getArCodeProvider } from "@/lib/services/arcode";
import { getImageEnhanceProvider } from "@/lib/services/nanobanana";
import {
  remainingEnhanceQuota,
  remainingModelQuota,
} from "@/lib/subscription/access";
import { MenuBuilder } from "@/components/panel/menu/menu-builder";

// Menü düzenleyici sayfası — kategoriler, yemekler, 3D ve yayın durumu.
export default async function MenuPage() {
  const user = await requireUser();
  const restaurant = await requireRestaurant(user.id);
  const menuId = restaurant.menu!.id;

  const [categories, dishes, subscription] = await Promise.all([
    prisma.category.findMany({
      where: { menuId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.dish.findMany({
      where: { menuId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
  ]);

  const arcodeEnabled = getArCodeProvider().isConfigured();
  const aiEnhanceEnabled = getImageEnhanceProvider().isConfigured();
  const quota = remainingModelQuota(subscription);
  const aiQuota = remainingEnhanceQuota(subscription);

  // Decimal/Date doğrudan client'a geçemez → düzleştir.
  const categoryData = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    imageUrl: c.imageUrl,
    hasTheme: c.themeSettings != null,
    sortOrder: c.sortOrder,
  }));

  const dishData = dishes.map((d) => ({
    id: d.id,
    categoryId: d.categoryId,
    name: d.name,
    description: d.description,
    price: Number(d.price),
    imageUrl: d.imageUrl,
    thumbnailUrl: d.thumbnailUrl,
    originalImageUrl: d.originalImageUrl,
    modelStatus: d.modelStatus,
    isAvailable: d.isAvailable,
    sortOrder: d.sortOrder,
  }));

  return (
    <MenuBuilder
      initialCategories={categoryData}
      initialDishes={dishData}
      arcodeEnabled={arcodeEnabled}
      aiEnhanceEnabled={aiEnhanceEnabled}
      quota={quota}
      aiEnhanceQuota={aiQuota}
      isPublished={restaurant.menu!.isPublished}
      slug={restaurant.slug}
    />
  );
}
