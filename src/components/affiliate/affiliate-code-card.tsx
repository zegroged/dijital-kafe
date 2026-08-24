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

// Komisyoncunun referans KODU (link değil). Müşteri kayıt olurken bu kodu girer.
export function AffiliateCodeCard({
  code,
  active,
}: {
  code: string;
  active: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referans kodu kopyalandı");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Kopyalanamadı");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referans kodun</CardTitle>
        <CardDescription>
          Müşterilerin paralı paket alırken bu kodu girer. Kodunla gelen ve paket
          alan her müşteriden komisyon kazanırsın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border bg-muted/40 px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.2em]">
            {code}
          </div>
          <Button
            type="button"
            onClick={copy}
            variant="outline"
            className="h-[58px] shrink-0"
          >
            {copied ? "Kopyalandı ✓" : "Kopyala"}
          </Button>
        </div>
        {!active && (
          <p className="text-sm text-amber-600">
            ⚠️ Kodun şu an <strong>pasif</strong>. E-posta adresini onayladıktan
            sonra kodun aktifleşir ve müşteriler kayıtta kullanabilir.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
