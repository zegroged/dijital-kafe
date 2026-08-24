"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Admin: bir referans ilişkisini durdur (recurring komisyonu kes) / sürdür.
export function ReferralCancelButton({
  referralId,
  cancelled,
}: {
  referralId: string;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/referrals/${referralId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success(
        data.status === "cancelled" ? "Komisyon durduruldu" : "Komisyon sürdürüldü",
      );
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={cancelled ? "outline" : "destructive"}
      onClick={toggle}
      disabled={busy}
    >
      {busy ? "…" : cancelled ? "Sürdür" : "Durdur"}
    </Button>
  );
}
