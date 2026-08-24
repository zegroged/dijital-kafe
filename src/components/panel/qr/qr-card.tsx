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
import { Separator } from "@/components/ui/separator";

interface QrCardProps {
  url: string;
  png: string; // data URL (image/png)
  svg: string; // ham <svg> string
  slug: string;
}

// Bir dataURL/Blob'u tarayıcıda indirme tetikler.
function downloadHref(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function QrCard({ url, png, svg, slug }: QrCardProps) {
  const [copied, setCopied] = useState(false);

  function downloadPng() {
    downloadHref(png, `${slug}-qr.png`);
    toast.success("PNG indiriliyor");
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    downloadHref(href, `${slug}-qr.svg`);
    // İndirme başlamadan blob URL iptal edilmesin (Firefox yarışı) → bir sonraki tick.
    setTimeout(() => URL.revokeObjectURL(href), 0);
    toast.success("SVG indiriliyor");
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Menü adresi kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopyalanamadı, adresi elle seçin");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Kodunuz</CardTitle>
        <CardDescription>
          Bu kodu masalara, menüye veya tabelaya yerleştirin. Müşterileriniz
          telefonlarıyla okutarak menünüze ulaşır.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={png}
              alt="Menü QR kodu"
              width={256}
              height={256}
              className="h-56 w-56"
            />
          </div>

          <div className="flex w-full max-w-md items-center gap-2">
            <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
              {url}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyUrl}
            >
              {copied ? "Kopyalandı ✓" : "Kopyala"}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={downloadPng}>
            PNG indir
          </Button>
          <Button type="button" variant="outline" onClick={downloadSvg}>
            SVG indir
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Baskı için yüksek çözünürlüklü SVG&apos;yi tercih edin; ekran ve sosyal
          medya için PNG yeterlidir.
        </p>
      </CardContent>
    </Card>
  );
}
