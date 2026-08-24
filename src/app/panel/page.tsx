import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireRestaurant, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function PanelHomePage() {
  const user = await requireUser();
  const restaurant = await requireRestaurant(user.id);
  const menuId = restaurant.menu!.id;

  const [categoryCount, dishCount, subscription] = await Promise.all([
    prisma.category.count({ where: { menuId } }),
    prisma.dish.count({ where: { menuId } }),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
  ]);

  const trialEnds = subscription?.trialEndsAt
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(
        subscription.trialEndsAt,
      )
    : null;
  const published = restaurant.menu!.isPublished;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Hoş geldin{user.name ? `, ${user.name}` : ""}! 👋
        </h1>
        <p className="mt-1 text-muted-foreground">{restaurant.businessName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Kategori" value={categoryCount} />
        <Stat label="Yemek" value={dishCount} />
        <Stat label="Durum" value={published ? "Yayında" : "Taslak"} />
      </div>

      {!published && (
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-medium">Menünü tamamla</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Yemeklerini ekle, temanı seç ve menünü yayınla.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/panel/menu" className={buttonVariants({ size: "sm" })}>
              Menü Düzenle
            </Link>
            <Link
              href="/onboarding"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Kurulum Sihirbazı
            </Link>
          </div>
        </div>
      )}

      {trialEnds && (
        <p className="inline-block rounded-md bg-muted px-3 py-1.5 text-sm">
          Deneme süresi bitişi: <strong>{trialEnds}</strong>
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
