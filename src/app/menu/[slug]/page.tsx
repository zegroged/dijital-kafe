import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { MenuView } from "@/components/menu/menu-view";
import { MenuClosed } from "@/components/menu/menu-closed";
import { env } from "@/lib/env";
import { menuTag } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { getMenuAccess } from "@/lib/subscription/access";
import { parseTheme } from "@/lib/theme/schema";
import type { ModelStatus } from "@/generated/prisma/client";
import type { Metadata } from "next";

// Public menü sayfası. Middleware subdomain'i (kahvecim.to-p1.com) buraya
// /menu/[slug] olarak yönlendirir. 3D/AR sadece müşteri modalı açtığında
// tembel yüklenir.
//
// PERFORMANS: Menü İÇERİĞİ (kategoriler + ürünler + tema) slug başına bir cache
// etiketiyle (menu:<slug>) önbelleğe alınır → her QR taramasında tüm join'i
// yeniden çalıştırmak yerine cache'ten servis edilir; yayın/düzenleme etiketi
// tazeler. Abonelik/trial KAPISI cache dışıdır: her istekte canlı (new Date)
// değerlendirilir, böylece deneme bitişi anında yansır.

export const dynamic = "force-dynamic";

type Params = { slug: string };

type MenuContent = {
  userId: string;
  restaurant: {
    businessName: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
  };
  isPublished: boolean;
  themeSettings: unknown;
  categories: {
    id: string;
    name: string;
    icon: string | null;
    imageUrl: string | null;
    themeSettings: unknown;
  }[];
  dishes: {
    id: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    model3dUrl: string | null;
    modelUsdzUrl: string | null;
    modelStatus: ModelStatus;
  }[];
};

// Cache'lenebilir, tamamen serileştirilebilir (Decimal→number) menü içeriği.
// Abonelik bilinçli olarak DIŞARIDA bırakıldı (canlı kapı + Date serileştirmesi).
function getCachedMenuContent(slug: string): Promise<MenuContent | null> {
  return unstable_cache(
    async (): Promise<MenuContent | null> => {
      const r = await prisma.restaurant.findUnique({
        where: { slug },
        include: {
          menu: {
            include: {
              categories: { orderBy: { sortOrder: "asc" } },
              dishes: {
                where: { isAvailable: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });
      if (!r || !r.menu) return null;
      return {
        userId: r.userId,
        restaurant: {
          businessName: r.businessName,
          logoUrl: r.logoUrl,
          coverImageUrl: r.coverImageUrl,
          phone: r.phone,
          address: r.address,
          currency: r.currency,
        },
        isPublished: r.menu.isPublished,
        themeSettings: r.menu.themeSettings,
        categories: r.menu.categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          imageUrl: c.imageUrl,
          themeSettings: c.themeSettings,
        })),
        dishes: r.menu.dishes.map((d) => ({
          id: d.id,
          categoryId: d.categoryId,
          name: d.name,
          description: d.description,
          price: Number(d.price),
          imageUrl: d.imageUrl,
          thumbnailUrl: d.thumbnailUrl,
          model3dUrl: d.model3dUrl,
          modelUsdzUrl: d.modelUsdzUrl,
          modelStatus: d.modelStatus,
        })),
      };
    },
    ["menu-content", slug],
    { tags: [menuTag(slug)], revalidate: 60 },
  )();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedMenuContent(slug);
  if (!data) return { title: "Menü bulunamadı" };
  return {
    title: `${data.restaurant.businessName} · Menü`,
    description: data.restaurant.address ?? undefined,
    openGraph: {
      title: data.restaurant.businessName,
      images: data.restaurant.coverImageUrl
        ? [data.restaurant.coverImageUrl]
        : undefined,
    },
  };
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getCachedMenuContent(slug);
  if (!data) notFound();

  // Kapı için abonelik HER İSTEKTE taze çekilir (cache dışı, tek satır sorgu).
  const subscription = await prisma.subscription.findUnique({
    where: { userId: data.userId },
  });
  const theme = parseTheme(data.themeSettings);

  // 1) Abonelik kapısı (trial/abonelik bitmiş mi?)
  // ÖDEME KİLİDİ: OPEN_MEMBERSHIP=true iken kilit KAPALI → deneme/abonelik bitse
  // bile menü herkese açık kalır (ücretsiz kullanım). Kapı KODU olduğu gibi durur;
  // geri almak için tek adım yeterli: .env'de OPEN_MEMBERSHIP=false + web restart.
  const openMembership = env.OPEN_MEMBERSHIP === "true";
  const access = openMembership
    ? ({ visible: true } as const)
    : getMenuAccess(subscription);
  if (!access.visible) {
    const message =
      access.reason === "trial_expired"
        ? "Deneme süresi doldu"
        : "Abonelik sona erdi";
    return (
      <MenuClosed
        theme={theme}
        businessName={data.restaurant.businessName}
        logoUrl={data.restaurant.logoUrl}
        title={message}
        detail="Menü şu anda görüntülenemiyor. Lütfen daha sonra tekrar deneyin."
      />
    );
  }

  // 2) Yayın kapısı
  if (!data.isPublished) {
    return (
      <MenuClosed
        theme={theme}
        businessName={data.restaurant.businessName}
        logoUrl={data.restaurant.logoUrl}
        title="Bu menü henüz yayında değil"
        detail="İşletme menüsünü hazırlıyor. Kısa süre sonra burada olacak."
      />
    );
  }

  // 3) Görünür + yayında → tam menüyü render et.
  const categories = data.categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    imageUrl: c.imageUrl,
    theme: c.themeSettings ? parseTheme(c.themeSettings) : null,
  }));

  const dishes = data.dishes.map((d) => ({
    id: d.id,
    categoryId: d.categoryId,
    name: d.name,
    description: d.description,
    price: d.price,
    imageUrl: d.imageUrl,
    thumbnailUrl: d.thumbnailUrl,
    model3dUrl: d.model3dUrl,
    modelUsdzUrl: d.modelUsdzUrl,
    modelStatus: d.modelStatus,
    hasModel: d.modelStatus === "ready" && Boolean(d.model3dUrl),
  }));

  return (
    <MenuView
      theme={theme}
      restaurant={{
        businessName: data.restaurant.businessName,
        logoUrl: data.restaurant.logoUrl,
        coverImageUrl: data.restaurant.coverImageUrl,
        phone: data.restaurant.phone,
        address: data.restaurant.address,
        currency: data.restaurant.currency,
      }}
      categories={categories}
      dishes={dishes}
    />
  );
}
