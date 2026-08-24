import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireOwnerRole, requireRestaurant } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Türkiye sabit UTC+3 (DST yok) → bugünün başlangıcı (UTC anı).
function istanbulStartOfToday(): Date {
  const shifted = new Date(Date.now() + 3 * 3600 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 3 * 3600 * 1000);
}

export default async function PanelAdisyonPage() {
  const user = await requireOwnerRole();
  const restaurant = await requireRestaurant(user.id);
  const start = istanbulStartOfToday();

  const [openAgg, paidToday, staff] = await Promise.all([
    prisma.adisyon.aggregate({
      where: { restaurantId: restaurant.id, status: "open" },
      _count: true,
      _sum: { total: true },
    }),
    prisma.adisyon.findMany({
      where: { restaurantId: restaurant.id, status: "paid", closedAt: { gte: start } },
      select: { total: true, paymentMethod: true, openedById: true },
    }),
    prisma.staff.findMany({
      where: { restaurantId: restaurant.id },
      select: { userId: true, name: true },
    }),
  ]);

  const TRY = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: restaurant.currency ?? "TRY",
  });

  let todayTotal = 0;
  let cash = 0;
  let card = 0;
  const byStaff = new Map<string, { count: number; total: number }>();
  for (const a of paidToday) {
    const t = Number(a.total);
    todayTotal += t;
    if (a.paymentMethod === "cash") cash += t;
    else if (a.paymentMethod === "card") card += t;
    const cur = byStaff.get(a.openedById) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += t;
    byStaff.set(a.openedById, cur);
  }

  const nameByUser = new Map<string, string>();
  nameByUser.set(user.id, "Patron");
  for (const s of staff) nameByUser.set(s.userId, s.name ?? "Çalışan");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Adisyon & Rapor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bugünün özeti. Sipariş almak için adisyon ekranını aç.
          </p>
        </div>
        <Link href="/adisyon" className={buttonVariants({ className: "shrink-0" })}>
          Adisyon ekranını aç
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Bugün ciro" value={TRY.format(todayTotal)} />
        <Metric label="Bugün adisyon" value={String(paidToday.length)} />
        <Metric label="Açık adisyon" value={String(openAgg._count)} />
        <Metric
          label="Açık tutar"
          value={TRY.format(Number(openAgg._sum.total ?? 0))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Nakit (bugün)" value={TRY.format(cash)} />
        <Metric label="Kart (bugün)" value={TRY.format(card)} />
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Bugün garson bazlı</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Kişi</th>
                <th className="px-3 py-2 font-medium">Adisyon</th>
                <th className="px-3 py-2 font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {[...byStaff.entries()].map(([uid, v]) => (
                <tr key={uid} className="border-t">
                  <td className="px-3 py-2">{nameByUser.get(uid) ?? "—"}</td>
                  <td className="px-3 py-2">{v.count}</td>
                  <td className="px-3 py-2">{TRY.format(v.total)}</td>
                </tr>
              ))}
              {byStaff.size === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Bugün kapanan adisyon yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-lg font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
