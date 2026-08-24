import { ChangePassword } from "@/components/account/change-password";
import { TaxRecordCell } from "@/components/accountant/tax-record-cell";
import { WithholdingRateForm } from "@/components/accountant/withholding-rate-form";
import { PortalShell } from "@/components/portal-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAccountant } from "@/lib/auth/session";
import { WITHDRAWAL_STATUS_LABELS, type WithdrawalStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getWithholdingRate } from "@/lib/withdrawal/calc";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const TAX_LABELS: Record<string, string> = {
  individual_no_tax: "Mükellef değil",
  tax_registered: "Mükellef",
};

export default async function AccountantPage() {
  await requireAccountant();

  const [rate, withdrawals, paidAll] = await Promise.all([
    getWithholdingRate(),
    // İşlenecek/incelenecek talepler: onaylanmış + ödenmiş (son 100).
    prisma.withdrawalRequest.findMany({
      where: { status: { in: ["approved", "processing", "paid"] } },
      include: {
        affiliate: {
          select: { code: true, user: { select: { email: true, phone: true } } },
        },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
    }),
    // Dönemsel rapor için tüm ödenenler.
    prisma.withdrawalRequest.findMany({
      where: { status: "paid" },
      select: {
        paidAt: true,
        grossAmount: true,
        withholdingAmount: true,
        netAmount: true,
        taxStatus: true,
      },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  // Aylık rapor (YYYY-MM): adet, brüt, stopaj, net.
  const months = new Map<
    string,
    { count: number; gross: number; withholding: number; net: number }
  >();
  for (const w of paidAll) {
    const key = (w.paidAt ?? new Date(0)).toISOString().slice(0, 7);
    const m = months.get(key) ?? { count: 0, gross: 0, withholding: 0, net: 0 };
    m.count += 1;
    m.gross += Number(w.grossAmount);
    m.withholding += Number(w.withholdingAmount);
    m.net += Number(w.netAmount);
    months.set(key, m);
  }
  const monthRows = [...months.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthWithholding = months.get(thisMonth)?.withholding ?? 0;
  const pendingTaxRecord = withdrawals.filter(
    (w) => w.status === "paid" && !w.taxRecorded,
  ).length;

  return (
    <PortalShell label="Mali Müşavir">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Mali Müşavir Paneli</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stopaj oranını yönet, ödemelerde gider pusulası/fatura kaydını işle,
            dönemsel vergi raporunu al.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Aktif stopaj oranı" value={`%${Math.round(rate * 1000) / 10}`} />
          <Metric label="Bu ay kesilen stopaj" value={TRY.format(thisMonthWithholding)} />
          <Metric label="Kayıt bekleyen" value={String(pendingTaxRecord)} />
        </div>

        <WithholdingRateForm initialRate={rate} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Ödemeler & gider pusulası</CardTitle>
              <a
                href="/api/accountant/report/export"
                className="text-xs font-medium text-primary underline"
              >
                Vergi raporu (CSV)
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                İşlenecek ödeme yok.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Komisyoncu</th>
                      <th className="py-1.5 font-medium">Vergi</th>
                      <th className="py-1.5 font-medium">Brüt</th>
                      <th className="py-1.5 font-medium">Stopaj</th>
                      <th className="py-1.5 font-medium">Net</th>
                      <th className="py-1.5 font-medium">Belge</th>
                      <th className="py-1.5 font-medium">Durum</th>
                      <th className="py-1.5 font-medium">Gider pusulası</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-t align-top">
                        <td className="py-2">
                          {w.affiliate.user.email ?? w.affiliate.user.phone ?? "—"}
                          <span className="block text-xs text-muted-foreground">
                            {w.affiliate.code}
                          </span>
                        </td>
                        <td className="py-2">
                          {TAX_LABELS[w.taxStatus] ?? w.taxStatus}
                        </td>
                        <td className="py-2">{TRY.format(Number(w.grossAmount))}</td>
                        <td className="py-2">
                          {TRY.format(Number(w.withholdingAmount))}
                          <span className="block text-xs text-muted-foreground">
                            %{Math.round(Number(w.withholdingRate) * 1000) / 10}
                          </span>
                        </td>
                        <td className="py-2 font-medium">
                          {TRY.format(Number(w.netAmount))}
                        </td>
                        <td className="py-2">
                          {w.taxDocUrlSnapshot ? (
                            <a
                              href={w.taxDocUrlSnapshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Levha
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 text-xs">
                          {WITHDRAWAL_STATUS_LABELS[w.status as WithdrawalStatus]}
                        </td>
                        <td className="py-2">
                          <TaxRecordCell
                            id={w.id}
                            recorded={w.taxRecorded}
                            docNo={w.taxDocumentNo}
                            docAt={
                              w.taxDocumentAt
                                ? w.taxDocumentAt.toISOString().slice(0, 10)
                                : null
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aylık vergi özeti</CardTitle>
          </CardHeader>
          <CardContent>
            {monthRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz ödenmiş çekim yok.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Dönem</th>
                      <th className="py-1.5 font-medium">Adet</th>
                      <th className="py-1.5 font-medium">Brüt</th>
                      <th className="py-1.5 font-medium">Stopaj</th>
                      <th className="py-1.5 font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthRows.map(([key, m]) => (
                      <tr key={key} className="border-t">
                        <td className="py-2">{key}</td>
                        <td className="py-2">{m.count}</td>
                        <td className="py-2">{TRY.format(m.gross)}</td>
                        <td className="py-2 font-medium">
                          {TRY.format(m.withholding)}
                        </td>
                        <td className="py-2">{TRY.format(m.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <ChangePassword />
      </div>
    </PortalShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="text-lg font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
