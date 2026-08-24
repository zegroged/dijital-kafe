import { TableManager } from "@/components/panel/table-manager";
import { requireOwnerRole, requireRestaurant } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MasalarPage() {
  const user = await requireOwnerRole();
  const restaurant = await requireRestaurant(user.id);
  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, isActive: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Masalar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masalarını tanımla; garsonlar adisyonu bu masalara açar.
        </p>
      </div>
      <TableManager initial={tables} />
    </div>
  );
}
