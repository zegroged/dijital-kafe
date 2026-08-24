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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mali müşavir stopaj oranını (yüzde) panelden ayarlar.
export function WithholdingRateForm({ initialRate }: { initialRate: number }) {
  const router = useRouter();
  // Oranı yüzde olarak göster/düzenle (0.20 → 20).
  const [pct, setPct] = useState(String(Math.round(initialRate * 1000) / 10));
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const num = Number(pct.replace(",", "."));
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      toast.error("Oran 0–100 arası olmalı");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/accountant/withholding-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: num / 100 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kaydedilemedi");
        return;
      }
      toast.success(`Stopaj oranı %${Math.round(data.rate * 1000) / 10} olarak kaydedildi`);
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
        <CardTitle>Stopaj oranı</CardTitle>
        <CardDescription>
          Vergi mükellefi OLMAYAN komisyonculardan kesilecek gelir vergisi
          tevkifat oranı. Yalnız yeni çekim taleplerini etkiler (geçmiş talepler
          kendi oranıyla sabit kalır). Mevzuata uygun oranı sen belirlersin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="wr-rate">Oran (%)</Label>
            <Input
              id="wr-rate"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              inputMode="decimal"
              className="w-28"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
