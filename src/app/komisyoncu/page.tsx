import { ChangePassword } from "@/components/account/change-password";
import {
  PayoutInfoForm,
  type PayoutInfo,
} from "@/components/account/payout-info-form";
import { AffiliateCodeCard } from "@/components/affiliate/affiliate-code-card";
import { TaxStatusForm } from "@/components/affiliate/tax-status-form";
import { VerifyEmailBanner } from "@/components/affiliate/verify-email-banner";
import { WithdrawCard } from "@/components/affiliate/withdraw-card";
import { WithdrawalCancelButton } from "@/components/affiliate/withdrawal-cancel-button";
import { PortalShell } from "@/components/portal-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAffiliate } from "@/lib/auth/session";
import {
  MIN_WITHDRAWAL_TRY,
  WITHDRAWAL_STATUS_LABELS,
  type WithdrawalStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getAffiliateBalance } from "@/lib/withdrawal/balance";
import { getWithholdingRate } from "@/lib/withdrawal/calc";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const SUB_LABELS: Record<string, string> = {
  trialing: "Deneme",
  active: "Aktif",
  expired: "Süresi doldu",
  cancelled: "İptal",
};

const OPEN: WithdrawalStatus[] = ["requested", "approved", "processing"];

export default async function AffiliatePage() {
  const { affiliate } = await requireAffiliate();

  const [acct, commissions, referrals, withdrawals, balance, withholding] =
    await Promise.all([
    prisma.user.findUnique({
      where: { id: affiliate.userId },
      select: { email: true, emailVerified: true },
    }),
    prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        referral: { select: { referredUser: { select: { email: true } } } },
      },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.referral.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        referredUser: {
          select: {
            email: true,
            subscription: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { requestedAt: "desc" },
      take: 50,
    }),
    getAffiliateBalance(affiliate.id),
    getWithholdingRate(),
  ]);

  const isRecurring = affiliate.commissionType === "recurring";
  const ratePct = Math.round(Number(affiliate.commissionRate) * 100);
  const verified = Boolean(acct?.emailVerified);
  const payoutInfo = (affiliate.payoutInfo ?? {}) as unknown as PayoutInfo;
  const hasIban = Boolean(payoutInfo.iban && payoutInfo.holder);
  const hasOpenRequest = withdrawals.some((w) =>
    OPEN.includes(w.status as WithdrawalStatus),
  );

  return (
    <PortalShell label="Komisyoncu">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Komisyoncu Paneli</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRecurring ? (
              <>
                <strong>Devam eden komisyon:</strong> getirdiğin müşteri
                aboneliğini sürdürdükçe her ödemeden %{ratePct} kazanırsın.
              </>
            ) : (
              <>
                <strong>Tek seferlik komisyon:</strong> getirdiğin her müşterinin
                ilk paket ödemesinden bir kez %{ratePct} kazanırsın.
              </>
            )}
          </p>
        </div>

        {!verified && <VerifyEmailBanner email={acct?.email ?? ""} />}

        <AffiliateCodeCard code={affiliate.code} active={verified} />

        <WithdrawCard
          available={balance.available}
          locked={balance.locked}
          withdrawn={balance.withdrawn}
          minWithdrawal={MIN_WITHDRAWAL_TRY}
          hasIban={hasIban}
          taxStatus={affiliate.taxStatus}
          hasDoc={Boolean(affiliate.taxDocUrl)}
          withholdingRate={withholding}
          hasOpenRequest={hasOpenRequest}
        />

        <Card>
          <CardHeader>
            <CardTitle>Çekim talepleri</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz çekim talebin yok.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Tarih</th>
                      <th className="py-1.5 font-medium">Brüt</th>
                      <th className="py-1.5 font-medium">Stopaj</th>
                      <th className="py-1.5 font-medium">Net</th>
                      <th className="py-1.5 font-medium">Durum</th>
                      <th className="py-1.5 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-t">
                        <td className="py-2">
                          {w.requestedAt.toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-2">{TRY.format(Number(w.grossAmount))}</td>
                        <td className="py-2">
                          {TRY.format(Number(w.withholdingAmount))}
                        </td>
                        <td className="py-2 font-medium">
                          {TRY.format(Number(w.netAmount))}
                        </td>
                        <td className="py-2">
                          {WITHDRAWAL_STATUS_LABELS[w.status as WithdrawalStatus]}
                          {w.status === "rejected" && w.rejectReason ? (
                            <span className="block text-xs text-muted-foreground">
                              {w.rejectReason}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2">
                          {w.status === "requested" ? (
                            <WithdrawalCancelButton id={w.id} />
                          ) : null}
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
            <CardTitle>Komisyon geçmişi</CardTitle>
            <CardDescription>
              {isRecurring
                ? "Her ödeme bir komisyon satırı üretir."
                : "Her müşterinin ilk ödemesinden bir komisyon."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz komisyon yok. Kodunu paylaşmaya başla.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Müşteri</th>
                      <th className="py-1.5 font-medium">Paket</th>
                      <th className="py-1.5 font-medium">Tutar</th>
                      <th className="py-1.5 font-medium">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="py-2">{c.referral.referredUser.email}</td>
                        <td className="py-2">{c.plan}</td>
                        <td className="py-2">{TRY.format(Number(c.amount))}</td>
                        <td className="py-2">
                          {c.earnedAt.toLocaleDateString("tr-TR")}
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
            <CardTitle>Getirdiğin müşteriler</CardTitle>
            <CardDescription>
              {isRecurring
                ? "Abonelik aktif kaldıkça komisyon kazanmaya devam edersin."
                : "İlk ödeme yapan müşteriden komisyon hak edilir."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz referans yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Müşteri</th>
                      <th className="py-1.5 font-medium">Abonelik</th>
                      <th className="py-1.5 font-medium">Katılım</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2">{r.referredUser.email}</td>
                        <td className="py-2">
                          {SUB_LABELS[r.referredUser.subscription?.status ?? ""] ??
                            "—"}
                        </td>
                        <td className="py-2">
                          {r.createdAt.toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <PayoutInfoForm initial={payoutInfo} />

        <TaxStatusForm
          initialStatus={affiliate.taxStatus}
          initialDocUrl={affiliate.taxDocUrl}
        />

        <ChangePassword />
      </div>
    </PortalShell>
  );
}
