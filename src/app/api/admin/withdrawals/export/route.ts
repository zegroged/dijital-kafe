import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// CSV alanı kaçışı (virgül/tırnak/satır).
function csv(v: string): string {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

// GET /api/admin/withdrawals/export → ONAYLANMIŞ taleplerin CSV'si.
// Papara Business "toplu ödeme" yüklemesi / banka için: ad, IBAN, net tutar, referans.
export const GET = apiHandler(async () => {
  await requireAdminContext();

  const rows = await prisma.withdrawalRequest.findMany({
    where: { status: "approved" },
    orderBy: { approvedAt: "asc" },
    select: {
      id: true,
      holderSnapshot: true,
      ibanSnapshot: true,
      netAmount: true,
    },
  });

  const header = "ad_soyad,iban,net_tutar,para_birimi,referans";
  const lines = rows.map((r) =>
    [
      csv(r.holderSnapshot ?? ""),
      csv(r.ibanSnapshot ?? ""),
      Number(r.netAmount).toFixed(2),
      "TRY",
      r.id,
    ].join(","),
  );
  const body = "﻿" + [header, ...lines].join("\r\n"); // BOM → Excel TR uyumu

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cekim-talepleri.csv"',
      // Hassas finansal veri (ad + IBAN) → önbelleğe alınmasın.
      "Cache-Control": "no-store, max-age=0",
    },
  });
});
