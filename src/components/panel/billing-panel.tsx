"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KDV_RATE, PAID_PLAN, PLANS, withKdv, type PlanKey } from "@/lib/constants";

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export function BillingPanel({
  currentPlan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  paymentEnabled,
}: {
  currentPlan: PlanKey;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentEnabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const plan = PLANS[PAID_PLAN];
  const net = plan.priceMonthly;
  const gross = withKdv(net);
  const isPaidActive = currentPlan === PAID_PLAN && status === "active";
  const periodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("tr-TR")
    : null;

  async function post(path: string, okMsg: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast.success(okMsg);
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: PAID_PLAN }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Ödeme başlatılamadı");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast.success("Tam Erişim aktif edildi");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-foreground/70">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{plan.label}</span>
          <span className="text-right">
            <span className="text-lg font-bold">{TRY.format(net)}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              + KDV /ay
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              KDV dahil {TRY.format(gross)} (%{Math.round(KDV_RATE * 100)} KDV)
            </span>
          </span>
        </CardTitle>
        <CardDescription>
          Tüm temalar + tam renk + efektler · aylık {plan.aiEnhanceQuota} AI
          fotoğraf canlandırma · sınırsız ürün/kategori · QR. Kısıtlama yok.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPaidActive ? (
          <>
            <p className="text-sm">
              Durum: <strong>Aktif</strong>
              {periodEnd ? (
                <>
                  {" "}
                  ·{" "}
                  {cancelAtPeriodEnd
                    ? `${periodEnd} tarihinde kapanacak (yenilenmeyecek)`
                    : `bir sonraki yenileme: ${periodEnd}`}
                </>
              ) : null}
            </p>
            {cancelAtPeriodEnd ? (
              <Button
                onClick={() => post("/api/billing/resume", "Yenileme tekrar açıldı")}
                disabled={busy}
              >
                {busy ? "…" : "Yenilemeyi sürdür"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() =>
                  post(
                    "/api/billing/cancel",
                    "İptal alındı · dönem sonuna kadar erişimin sürer",
                  )
                }
                disabled={busy}
              >
                {busy ? "…" : "Aboneliği iptal et"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              İptal edersen dönem sonuna kadar her şeyi kullanmaya devam edersin;
              sonrasında otomatik yenilenmez.
            </p>
          </>
        ) : (
          <>
            <Button
              className="w-full"
              disabled={!paymentEnabled || busy}
              onClick={buy}
            >
              {busy
                ? "…"
                : paymentEnabled
                  ? "Tam Erişim'e geç"
                  : "Ödeme yakında"}
            </Button>
            {status === "trialing" ? (
              <p className="text-xs text-muted-foreground">
                Deneme sürende tüm özellikler açık. Süre bitince Tam
                Erişim&apos;e geçebilirsin.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
