"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mali müşavir bir çekim için gider pusulası / fatura no + tarih kaydeder.
export function TaxRecordCell({
  id,
  recorded,
  docNo,
  docAt,
}: {
  id: string;
  recorded: boolean;
  docNo: string | null;
  docAt: string | null; // YYYY-MM-DD
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [no, setNo] = useState(docNo ?? "");
  const [date, setDate] = useState(docAt ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/accountant/withdrawals/${id}/tax-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recorded: true,
          taxDocumentNo: no || undefined,
          taxDocumentAt: date || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kaydedilemedi");
        return;
      }
      toast.success("Vergi kaydı işlendi");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left text-xs"
      >
        {recorded ? (
          <span className="text-foreground">
            ✓ {docNo || "kayıtlı"}
            <span className="block text-muted-foreground underline">düzenle</span>
          </span>
        ) : (
          <span className="font-medium text-primary underline">Kaydet</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        value={no}
        onChange={(e) => setNo(e.target.value)}
        placeholder="Belge no"
        className="h-8 w-32 text-xs"
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-8 w-36 text-xs"
      />
      <div className="flex gap-1">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "…" : "Kaydet"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          İptal
        </Button>
      </div>
    </div>
  );
}
