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

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export function WithdrawCard({
  available,
  locked,
  withdrawn,
  minWithdrawal,
  hasIban,
  taxStatus,
  hasDoc,
  withholdingRate,
  hasOpenRequest,
}: {
  available: number;
  locked: number;
  withdrawn: number;
  minWithdrawal: number;
  hasIban: boolean;
  taxStatus: "individual_no_tax" | "tax_registered";
  hasDoc: boolean;
  withholdingRate: number;
  hasOpenRequest: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const isRegistered = taxStatus === "tax_registered";
  const withholding = isRegistered ? 0 : Math.round(available * withholdingRate * 100) / 100;
  const net = Math.round((available - withholding) * 100) / 100;

  // Engeller (öncelik sırası).
  let blocker: string | null = null;
  if (hasOpenRequest) blocker = "Bekleyen bir çekim talebin var. Önce o sonuçlanmalı.";
  else if (!hasIban) blocker = "Önce aşağıdan IBAN/ödeme bilgilerini doldur.";
  else if (isRegistered && !hasDoc) blocker = "Vergi mükellefi olarak vergi levhanı yükle.";
  else if (available < minWithdrawal)
    blocker = `Çekim için en az ${TRY.format(minWithdrawal)} gerekir.`;

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/withdrawals", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Talep oluşturulamadı");
        return;
      }
      toast.success(`Çekim talebin alındı. Net: ${TRY.format(data.net)}`);
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bakiye & Çekim</CardTitle>
        <CardDescription>
          Çekilebilir bakiyenin tamamı için talep oluşturursun. Admin onayından
          sonra IBAN&apos;ına gönderilir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Çekilebilir" value={TRY.format(available)} strong />
          <Stat label="Talepte" value={TRY.format(locked)} />
          <Stat label="Ödenen" value={TRY.format(withdrawn)} />
        </div>

        {blocker ? (
          <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {blocker}
          </p>
        ) : confirming ? (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1 text-sm">
              <Row label="Brüt komisyon" value={TRY.format(available)} />
              {!isRegistered && (
                <Row
                  label={`Stopaj (%${Math.round(withholdingRate * 100)})`}
                  value={`− ${TRY.format(withholding)}`}
                />
              )}
              <Row label="Gönderilecek net" value={TRY.format(net)} strong />
            </div>
            <p className="text-xs text-muted-foreground">
              {isRegistered
                ? "Vergi mükellefi olduğun için brüt gönderilir; beyanı sen yaparsın."
                : "Vergi mükellefi olmadığın için yasal stopaj kesilip net gönderilir."}
            </p>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={busy}>
                {busy ? "Gönderiliyor…" : "Onayla ve talep et"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setConfirming(true)}>Çekim Talep Et</Button>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div
        className={
          "tracking-tight " + (strong ? "text-lg font-bold" : "text-sm font-semibold")
        }
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
