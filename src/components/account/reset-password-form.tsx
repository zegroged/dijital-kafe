"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Şifre sıfırlanamadı");
        return;
      }
      toast.success("Şifren güncellendi, giriş yapabilirsin");
      router.push("/giris");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni şifre belirle</CardTitle>
        <CardDescription>
          Hesabın için yeni bir şifre oluştur.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Geçersiz veya eksik bağlantı. Lütfen sıfırlama bağlantısını yeniden
              talep et.
            </p>
            <Link
              href="/sifremi-unuttum"
              className="text-sm text-foreground underline"
            >
              Yeniden talep et
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Yeni şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Yeni şifre (tekrar)</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Kaydediliyor…" : "Şifreyi güncelle"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
