"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type TaxStatus = "individual_no_tax" | "tax_registered";

// Komisyoncu vergi durumunu seçer; mükellefse vergi levhasının fotoğrafını yükler.
export function TaxStatusForm({
  initialStatus,
  initialDocUrl,
}: {
  initialStatus: TaxStatus;
  initialDocUrl: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TaxStatus>(initialStatus);
  const [docUrl, setDocUrl] = useState<string | null>(initialDocUrl);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/affiliate/tax-doc", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Yüklenemedi");
        return;
      }
      setDocUrl(data.imageUrl);
      toast.success("Belge yüklendi");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (busy) return;
    if (status === "tax_registered" && !docUrl) {
      toast.error("Vergi mükellefi için belge yüklemelisin");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/tax-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxStatus: status, taxDocUrl: docUrl ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kaydedilemedi");
        return;
      }
      toast.success("Vergi durumun kaydedildi");
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
        <CardTitle>Vergi durumu</CardTitle>
        <CardDescription>
          Çekim yapabilmek için vergi durumunu belirt. Mükellef değilsen yasal
          stopaj kesilir; mükellefsen belge yükle, brüt alırsın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Option
            active={status === "individual_no_tax"}
            onClick={() => setStatus("individual_no_tax")}
            title="Vergi mükellefi değilim"
            desc="Stopaj kesilip net gönderilir"
          />
          <Option
            active={status === "tax_registered"}
            onClick={() => setStatus("tax_registered")}
            title="Vergi mükellefiyim"
            desc="Belge yükle, brüt al (kendin beyan et)"
          />
        </div>

        {status === "tax_registered" && (
          <div className="space-y-1.5">
            <Label>Vergi levhası (fotoğraf)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Yükleniyor…" : docUrl ? "Değiştir" : "Belge yükle"}
              </Button>
              {docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Yüklenen belgeyi gör
                </a>
              )}
            </div>
          </div>
        )}

        <Button onClick={save} disabled={busy}>
          {busy ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Option({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-lg border p-2.5 text-left transition " +
        (active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-input hover:bg-accent")
      }
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
