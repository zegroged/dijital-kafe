"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Komisyoncu kendi bekleyen (requested) talebini iptal eder.
export function WithdrawalCancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/affiliate/withdrawals/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "İptal edilemedi");
        return;
      }
      toast.success("Talep iptal edildi");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={cancel} disabled={busy}>
      {busy ? "…" : "İptal"}
    </Button>
  );
}
