import { AdminForms } from "@/components/admin/admin-forms";
import { ReferralCancelButton } from "@/components/admin/referral-cancel-button";
import { WithdrawalActions } from "@/components/admin/withdrawal-actions";
import {
  COMMISSION_TYPE_LABELS,
  WITHDRAWAL_STATUS_LABELS,
  type WithdrawalStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});
const TRY2 = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  earned: "Çekilebilir",
  requested: "Talepte",
  withdrawn: "Ödendi",
  paid: "Ödendi",
  cancelled: "İptal",
};

const REFERRAL_STATUS_LABELS: Record<string, string> = {
  pending: "Ödeme bekliyor",
  earned: "Aktif",
  paid: "Aktif",
  cancelled: "Durduruldu",
};

export default async function AdminPage() {
  const [
    affiliates,
    vendors,
    commissions,
    referrals,
    orders,
    commissionSums,
    activeSubs,
    ownerCount,
    qrRevenue,
    withdrawals,
    pendingPayout,
  ] = await Promise.all([
    prisma.affiliate.findMany({
      include: {
        user: { select: { email: true, phone: true, name: true } },
        _count: { select: { referrals: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.qrVendor.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commission.findMany({
      include: {
        affiliate: { select: { code: true } },
        referral: { select: { referredUser: { select: { email: true } } } },
      },
      orderBy: { earnedAt: "desc" },
      take: 50,
    }),
    prisma.referral.findMany({
      include: {
        affiliate: { select: { code: true, commissionType: true } },
        referredUser: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.qrOrder.findMany({
      include: {
        product: { select: { name: true } },
        vendor: { select: { companyName: true } },
        buyer: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.commission.groupBy({
      by: ["affiliateId", "status"],
      _sum: { amount: true },
    }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.user.count({ where: { role: "owner" } }),
    prisma.qrOrder.aggregate({
      _sum: { platformFee: true },
      where: { status: { in: ["paid", "processing", "shipped", "delivered"] } },
    }),
    prisma.withdrawalRequest.findMany({
      where: { status: { in: ["requested", "approved", "processing"] } },
      include: {
        affiliate: {
          select: {
            code: true,
            user: { select: { email: true, phone: true } },
          },
        },
      },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.withdrawalRequest.aggregate({
      _sum: { netAmount: true },
      where: { status: { in: ["requested", "approved", "processing"] } },
    }),
  ]);

  // Komisyoncu başına çekilebilir (earned) + toplam ödenen (withdrawn + legacy paid).
  const balanceByAff = new Map<string, number>();
  let totalAvailable = 0;
  let totalPaidOut = 0;
  for (const g of commissionSums) {
    const amt = Number(g._sum.amount ?? 0);
    if (g.status === "earned") {
      balanceByAff.set(g.affiliateId, (balanceByAff.get(g.affiliateId) ?? 0) + amt);
      totalAvailable += amt;
    } else if (g.status === "withdrawn" || g.status === "paid") {
      totalPaidOut += amt;
    }
  }
  const pendingPayoutNet = Number(pendingPayout._sum.netAmount ?? 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Yönetim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Komisyoncular, QR üreticiler, komisyonlar ve siparişler.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Aktif abonelik" value={String(activeSubs)} />
        <Metric label="Restoran sahibi" value={String(ownerCount)} />
        <Metric label="Çekilebilir bakiye" value={TRY.format(totalAvailable)} />
        <Metric label="Bekleyen çekim (net)" value={TRY.format(pendingPayoutNet)} />
        <Metric label="Ödenen komisyon" value={TRY.format(totalPaidOut)} />
        <Metric
          label="QR platform geliri"
          value={TRY.format(Number(qrRevenue._sum.platformFee ?? 0))}
        />
      </div>

      <AdminForms />

      <Section
        title={`Çekim talepleri (${withdrawals.length})`}
        note="Onayla → (gerekirse CSV indir) → Ödendi işaretle"
      >
        <div className="border-b px-3 py-2 text-right">
          <a
            href="/api/admin/withdrawals/export"
            className="text-xs font-medium text-primary underline"
          >
            Onaylananları CSV indir (Papara/banka toplu ödeme)
          </a>
        </div>
        <Table head={["Komisyoncu", "Brüt", "Stopaj", "Net", "IBAN", "Belge", "Durum", ""]}>
          {withdrawals.map((w) => (
            <tr key={w.id} className="border-t">
              <Td>
                {w.affiliate.user.email ?? w.affiliate.user.phone ?? "—"}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({w.affiliate.code})
                </span>
              </Td>
              <Td>{TRY2.format(Number(w.grossAmount))}</Td>
              <Td>{TRY2.format(Number(w.withholdingAmount))}</Td>
              <Td className="font-medium">{TRY2.format(Number(w.netAmount))}</Td>
              <Td>
                <span className="font-mono text-xs">{w.ibanSnapshot ?? "—"}</span>
                {w.holderSnapshot ? (
                  <span className="block text-xs text-muted-foreground">
                    {w.holderSnapshot}
                  </span>
                ) : null}
              </Td>
              <Td>
                {w.taxDocUrlSnapshot ? (
                  <a
                    href={w.taxDocUrlSnapshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Levha
                  </a>
                ) : w.taxStatus === "tax_registered" ? (
                  <span className="text-xs text-muted-foreground">eksik</span>
                ) : (
                  <span className="text-xs text-muted-foreground">stopajlı</span>
                )}
              </Td>
              <Td>{WITHDRAWAL_STATUS_LABELS[w.status as WithdrawalStatus]}</Td>
              <Td>
                <WithdrawalActions
                  id={w.id}
                  status={w.status as WithdrawalStatus}
                />
              </Td>
            </tr>
          ))}
          {withdrawals.length === 0 && <Empty cols={8} />}
        </Table>
      </Section>

      <Section title={`Komisyoncular (${affiliates.length})`}>
        <Table head={["E-posta", "Kod", "Tip", "Referans", "Bakiye"]}>
          {affiliates.map((a) => (
            <tr key={a.id} className="border-t">
              <Td>{a.user.email ?? a.user.phone ?? "—"}</Td>
              <Td>
                <code className="rounded bg-muted px-1.5 py-0.5">{a.code}</code>
              </Td>
              <Td>{COMMISSION_TYPE_LABELS[a.commissionType]}</Td>
              <Td>{a._count.referrals}</Td>
              <Td>{TRY2.format(balanceByAff.get(a.id) ?? 0)}</Td>
            </tr>
          ))}
          {affiliates.length === 0 && <Empty cols={5} />}
        </Table>
      </Section>

      <Section
        title={`Komisyon kayıtları (${commissions.length})`}
        note={`Çekilebilir: ${TRY2.format(totalAvailable)} · Ödenen: ${TRY2.format(totalPaidOut)}`}
      >
        <Table head={["Müşteri", "Kod", "Paket", "Tutar", "Durum", "Tarih"]}>
          {commissions.map((c) => (
            <tr key={c.id} className="border-t">
              <Td>{c.referral.referredUser.email}</Td>
              <Td>
                <code className="rounded bg-muted px-1.5 py-0.5">
                  {c.affiliate.code}
                </code>
              </Td>
              <Td>{c.plan}</Td>
              <Td>{TRY2.format(Number(c.amount))}</Td>
              <Td>{COMMISSION_STATUS_LABELS[c.status] ?? c.status}</Td>
              <Td>{c.earnedAt.toLocaleDateString("tr-TR")}</Td>
            </tr>
          ))}
          {commissions.length === 0 && <Empty cols={6} />}
        </Table>
      </Section>

      <Section
        title={`Referans ilişkileri (${referrals.length})`}
        note="Durdur → bu müşteriden yeni komisyon yazılmaz (recurring kesilir)"
      >
        <Table head={["Müşteri", "Kod", "Tip", "Durum", ""]}>
          {referrals.map((r) => (
            <tr key={r.id} className="border-t">
              <Td>{r.referredUser.email}</Td>
              <Td>
                <code className="rounded bg-muted px-1.5 py-0.5">
                  {r.affiliate.code}
                </code>
              </Td>
              <Td>{COMMISSION_TYPE_LABELS[r.affiliate.commissionType]}</Td>
              <Td>{REFERRAL_STATUS_LABELS[r.status] ?? r.status}</Td>
              <Td>
                <ReferralCancelButton
                  referralId={r.id}
                  cancelled={r.status === "cancelled"}
                />
              </Td>
            </tr>
          ))}
          {referrals.length === 0 && <Empty cols={5} />}
        </Table>
      </Section>

      <Section title={`QR Üreticiler (${vendors.length})`}>
        <Table head={["Firma", "E-posta", "Ürün", "Sipariş"]}>
          {vendors.map((v) => (
            <tr key={v.id} className="border-t">
              <Td>{v.companyName}</Td>
              <Td>{v.user.email}</Td>
              <Td>{v._count.products}</Td>
              <Td>{v._count.orders}</Td>
            </tr>
          ))}
          {vendors.length === 0 && <Empty cols={4} />}
        </Table>
      </Section>

      <Section title={`QR Siparişleri (${orders.length})`}>
        <Table head={["Ürün", "Üretici", "Alıcı", "Tutar", "Pay", "Durum"]}>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <Td>{o.product.name}</Td>
              <Td>{o.vendor.companyName}</Td>
              <Td>{o.buyer.email}</Td>
              <Td>{TRY2.format(Number(o.total))}</Td>
              <Td>{TRY2.format(Number(o.platformFee))}</Td>
              <Td>{o.status}</Td>
            </tr>
          ))}
          {orders.length === 0 && <Empty cols={6} />}
        </Table>
      </Section>
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

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {note ? (
          <span className="text-xs text-muted-foreground">{note}</span>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border">{children}</div>
    </section>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
          {head.map((h, i) => (
            <th key={h || i} className="px-3 py-2 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2${className ? ` ${className}` : ""}`}>{children}</td>;
}

function Empty({ cols }: { cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-3 py-6 text-center text-sm text-muted-foreground"
      >
        Henüz kayıt yok.
      </td>
    </tr>
  );
}
