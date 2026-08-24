import { prisma } from "@/lib/prisma";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Adisyon toplamını kalemlerinden yeniden hesaplar ve yazar.
export async function recalcAdisyonTotal(adisyonId: string): Promise<number> {
  const items = await prisma.adisyonItem.findMany({
    where: { adisyonId },
    select: { unitPrice: true, qty: true },
  });
  const total = round2(
    items.reduce((s, i) => s + Number(i.unitPrice) * i.qty, 0),
  );
  await prisma.adisyon.update({ where: { id: adisyonId }, data: { total } });
  return total;
}
