import { StaffManager } from "@/components/panel/staff-manager";
import { requireOwnerRole, requireRestaurant } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CalisanlarPage() {
  const user = await requireOwnerRole();
  const restaurant = await requireRestaurant(user.id);
  const staff = await prisma.staff.findMany({
    where: { restaurantId: restaurant.id },
    include: { user: { select: { phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = staff.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.user.phone,
    isActive: s.isActive,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Çalışanlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Garson hesapları aç; telefon + şifreyle girip adisyon tutarlar.
        </p>
      </div>
      <StaffManager initial={rows} />
    </div>
  );
}
