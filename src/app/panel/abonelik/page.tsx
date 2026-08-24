import { BillingPanel } from "@/components/panel/billing-panel";
import { requireUser } from "@/lib/auth/session";
import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/services/payment";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Abonelik</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mevcut paketin:{" "}
          <strong>{PLANS[sub?.plan ?? "free_trial"].label}</strong> ·{" "}
          {sub?.status ?? "—"}
        </p>
      </div>
      <BillingPanel
        currentPlan={sub?.plan ?? "free_trial"}
        status={sub?.status ?? null}
        currentPeriodEnd={sub?.currentPeriodEnd?.toISOString() ?? null}
        cancelAtPeriodEnd={sub?.cancelAtPeriodEnd ?? false}
        paymentEnabled={getPaymentProvider().isConfigured()}
      />
    </div>
  );
}
