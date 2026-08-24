"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type QrResult = {
  ok?: boolean;
  url?: string;
  png?: string;
  error?: string;
};

export function StepReady({
  onBack,
  initialPublished,
}: {
  onBack: () => void;
  initialPublished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<{ url: string; png: string } | null>(null);
  const [published, setPublished] = useState(initialPublished);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/qr")
      .then((r) => r.json())
      .then((data: QrResult) => {
        if (cancelled) return;
        if (!data.ok || !data.url || !data.png) {
          toast.error(data.error ?? "QR kod alınamadı");
          return;
        }
        setQr({ url: data.url, png: data.png });
      })
      .catch(() => {
        if (!cancelled) toast.error("QR kod alınırken hata oluştu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onPublish() {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/menu/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Menü yayınlanamadı");
        return;
      }
      setPublished(true);
      toast.success("Menün yayında! 🎉");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Her şey hazır! 🎉</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          QR kodunu masalara koy, müşterilerin menüne anında ulaşsın.
        </p>

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <Skeleton className="size-48 rounded-lg" />
          ) : qr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr.png}
                alt="Menü QR kodu"
                className="size-48 rounded-lg border bg-white p-2"
              />
              <a
                href={qr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm break-all text-primary underline"
              >
                {qr.url}
              </a>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">QR kod yüklenemedi.</p>
          )}
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-center">
          {published ? (
            <p className="text-sm font-medium text-emerald-600">
              ✓ Menün yayında
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Menünü yayınla, müşteriler görebilsin.
              </p>
              <Button onClick={onPublish} disabled={publishing}>
                {publishing ? "Yayınlanıyor…" : "Menüyü Yayınla"}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Geri
          </Button>
          <Button
            type="button"
            variant={published ? "default" : "outline"}
            onClick={() => router.push("/panel")}
          >
            Panele Git
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
