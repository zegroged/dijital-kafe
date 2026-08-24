"use client";

import Link from "next/link";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Güvenlik: hesap olsun olmasın aynı mesaj.
      setSent(true);
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Şifremi unuttum</CardTitle>
        <CardDescription>
          E-posta adresini gir; şifre sıfırlama bağlantısını gönderelim.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.
              Gelen kutunu (ve spam klasörünü) kontrol et. Bağlantı 1 saat
              geçerlidir.
            </p>
            <Link href="/giris" className="text-sm text-foreground underline">
              Girişe dön
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/giris" className="text-foreground underline">
                Girişe dön
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
