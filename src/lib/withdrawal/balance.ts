import { prisma } from "@/lib/prisma";
import { round2 } from "./calc";

export interface AffiliateBalance {
  available: number; // earned → çekilebilir
  locked: number; // requested → açık talepte kilitli
  withdrawn: number; // withdrawn + legacy paid → ödenmiş
}

// Bakiye Commission(status) toplamlarından türetilir (ayrı Balance tablosu yok →
// çift defter riski sıfır, mutabakat kolay).
export async function getAffiliateBalance(
  affiliateId: string,
): Promise<AffiliateBalance> {
  const groups = await prisma.commission.groupBy({
    by: ["status"],
    where: { affiliateId },
    _sum: { amount: true },
  });

  let available = 0;
  let locked = 0;
  let withdrawn = 0;
  for (const g of groups) {
    const amt = Number(g._sum.amount ?? 0);
    if (g.status === "earned") available += amt;
    else if (g.status === "requested") locked += amt;
    else if (g.status === "withdrawn" || g.status === "paid") withdrawn += amt;
  }

  return {
    available: round2(available),
    locked: round2(locked),
    withdrawn: round2(withdrawn),
  };
}
