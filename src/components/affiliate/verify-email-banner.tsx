"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Komisyoncu paneli: e-posta doğrulama alanı. Komisyoncu kendi e-postasını girer,
// doğrulama maili gider; onaylayınca referans kodu aktifleşir. (E-posta hesap
// açılışında alınmaz — burada, ilk girişte ayarlanır.)
export function VerifyEmailBanner({ email: initial }: { email: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Gönderilemedi");
        return;
      }
      if (data.verified) {
        toast.success("E-postan onaylandı — kodun aktif!");
        router.refresh();
        return;
      }
      if (data.sent) {
        toast.success(`Doğrulama maili ${email} adresine gönderildi.`);
      } else {
        toast.error("Mail gönderilemedi. Yöneticinle iletişime geç.");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">E-postanı doğrula — kodun henüz aktif değil</p>
      <p className="mt-1">
        Referans kodun, e-posta adresini doğrulayana kadar <strong>pasif</strong>.
        E-postanı gir; doğrulama bağlantısını sana gönderelim, onayladığında kodun
        aktifleşir. Bu e-posta ayrıca <strong>giriş ve şifre sıfırlama</strong> için
        de kullanılır.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="aff-self-email" className="sr-only">
            E-posta
          </Label>
          <Input
            id="aff-self-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="eposta@adresin.com"
            required
            className="bg-white"
          />
        </div>
        <Button
          type="submit"
          disabled={busy || !email.trim()}
          variant="outline"
          className="shrink-0 border-amber-400 bg-white"
        >
          {busy
            ? "Gönderiliyor…"
            : initial
              ? "Tekrar gönder"
              : "Doğrulama maili gönder"}
        </Button>
      </form>
    </div>
  );
}
