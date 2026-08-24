import { apiHandler, requireAccountantContext } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csv(v: string): string {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

const fmtDate = (d: Date | null) =>
  d ? d.toISOString().slice(0, 10) : "";

// GET /api/accountant/report/export → ÖDENEN çekimlerin vergi detayı (muhtasar
// hazırlığı + gider pusulası mutabakatı). Hassas: no-store.
export const GET = apiHandler(async () => {
  await requireAccountantContext();

  const rows = await prisma.withdrawalRequest.findMany({
    where: { status: "paid" },
    orderBy: { paidAt: "desc" },
    include: {
      affiliate: {
        select: {
          code: true,
          user: { select: { email: true, phone: true, name: true } },
        },
      },
    },
  });

  const header = [
    "odeme_tarihi",
    "komisyoncu",
    "kod",
    "vergi_durumu",
    "brut",
    "stopaj_orani",
    "stopaj_tutari",
    "net",
    "gider_pusulasi_no",
    "belge_tarihi",
    "kayitli",
  ].join(",");

  const lines = rows.map((r) =>
    [
      fmtDate(r.paidAt),
      csv(
        r.affiliate.user.name ??
          r.affiliate.user.email ??
          r.affiliate.user.phone ??
          "",
      ),
      csv(r.affiliate.code),
      r.taxStatus === "tax_registered" ? "mukellef" : "mukellef_degil",
      Number(r.grossAmount).toFixed(2),
      Number(r.withholdingRate).toFixed(3),
      Number(r.withholdingAmount).toFixed(2),
      Number(r.netAmount).toFixed(2),
      csv(r.taxDocumentNo ?? ""),
      fmtDate(r.taxDocumentAt),
      r.taxRecorded ? "evet" : "hayir",
    ].join(","),
  );

  const body = "﻿" + [header, ...lines].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vergi-raporu.csv"',
      "Cache-Control": "no-store, max-age=0",
    },
  });
});
