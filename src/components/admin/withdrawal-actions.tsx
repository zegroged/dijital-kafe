"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Admin: çekim talebi aksiyonları. requested → onayla/reddet; approved → öde/reddet.
export function WithdrawalActions({
  id,
  status,
}: {
  id: string;
  status: "requested" | "approved" | "processing" | "paid" | "rejected";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(path: string, body?: unknown) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/${path}`, {
        method: "POST",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success("Tamam");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  function reject() {
    const reason = window.prompt("Red sebebi:");
    if (reason && reason.trim()) call("reject", { reason: reason.trim() });
  }

  if (status === "requested") {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => call("approve")} disabled={busy}>
          Onayla
        </Button>
        <Button size="sm" variant="destructive" onClick={reject} disabled={busy}>
          Reddet
        </Button>
      </div>
    );
  }
  if (status === "approved") {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => call("pay")} disabled={busy}>
          Ödendi işaretle
        </Button>
        <Button size="sm" variant="destructive" onClick={reject} disabled={busy}>
          Reddet
        </Button>
      </div>
    );
  }
  if (status === "processing") {
    return (
      <Button size="sm" variant="outline" onClick={() => call("recover")} disabled={busy}>
        Onaya geri al
      </Button>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
