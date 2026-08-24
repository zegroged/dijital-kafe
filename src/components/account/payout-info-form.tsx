"use client";

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

export interface PayoutInfo {
  holder?: string;
  iban?: string;
  bank?: string;
  note?: string;
}

// Komisyoncu: ödemenin yapılacağı IBAN/ad bilgisini girer.
export function PayoutInfoForm({ initial }: { initial: PayoutInfo }) {
  const [holder, setHolder] = useState(initial.holder ?? "");
  const [iban, setIban] = useState(initial.iban ?? "");
  const [bank, setBank] = useState(initial.bank ?? "");
  const [note, setNote] = useState(initial.note ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/payout-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holder,
          iban,
          bank: bank || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kaydedilemedi");
        return;
      }
      toast.success("Ödeme bilgilerin kaydedildi");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme bilgilerin</CardTitle>
        <CardDescription>
          Komisyonların bu IBAN&apos;a gönderilir. Eksiksiz ve doğru
          girdiğinden emin ol.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="po-holder">Ad Soyad (hesap sahibi)</Label>
            <Input
              id="po-holder"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="po-iban">IBAN</Label>
            <Input
              id="po-iban"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="po-bank">Banka (opsiyonel)</Label>
              <Input
                id="po-bank"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-note">Not (opsiyonel)</Label>
              <Input
                id="po-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
