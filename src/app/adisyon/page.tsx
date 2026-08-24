import {
  AdisyonBoard,
  type BoardTable,
  type MenuGroup,
} from "@/components/adisyon/adisyon-board";
import { PortalShell } from "@/components/portal-shell";
import { requireRestaurantActorPage } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdisyonPage() {
  const { restaurantId } = await requireRestaurantActorPage();

  const [restaurant, tables, openAdisyons, menu] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { currency: true },
    }),
    prisma.restaurantTable.findMany({
      where: { restaurantId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.adisyon.findMany({
      where: { restaurantId, status: "open" },
      select: { id: true, tableId: true, total: true },
    }),
    prisma.menu.findUnique({
      where: { restaurantId },
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        dishes: {
          where: { isAvailable: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  const currency = restaurant?.currency ?? "TRY";

  const openByTable = new Map(
    openAdisyons.filter((a) => a.tableId).map((a) => [a.tableId as string, a]),
  );
  const boardTables: BoardTable[] = tables.map((t) => {
    const a = openByTable.get(t.id);
    return {
      id: t.id,
      name: t.name,
      openAdisyonId: a?.id ?? null,
      openTotal: a ? Number(a.total) : 0,
    };
  });

  const cats = menu?.categories ?? [];
  const dishes = menu?.dishes ?? [];
  const groups: MenuGroup[] = cats
    .map((c) => ({
      category: c.name,
      dishes: dishes
        .filter((d) => d.categoryId === c.id)
        .map((d) => ({ id: d.id, name: d.name, price: Number(d.price) })),
    }))
    .filter((g) => g.dishes.length > 0);
  const uncategorized = dishes.filter((d) => !d.categoryId);
  if (uncategorized.length) {
    groups.push({
      category: "Diğer",
      dishes: uncategorized.map((d) => ({
        id: d.id,
        name: d.name,
        price: Number(d.price),
      })),
    });
  }

  return (
    <PortalShell label="Adisyon">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Adisyon</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masaya dokun → menüden ürün ekle → hesabı kapat.
          </p>
        </div>
        <AdisyonBoard tables={boardTables} menu={groups} currency={currency} />
      </div>
    </PortalShell>
  );
}
