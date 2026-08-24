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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Giriş yapmış kullanıcı kendi şifresini değiştirir (her panelde kullanılabilir).
export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (next !== confirm) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Şifre değiştirilemedi");
        return;
      }
      toast.success("Şifren güncellendi");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Şifre değiştir</CardTitle>
        <CardDescription>
          Güvenliğin için sana verilen geçici şifreyi değiştir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-current">Mevcut şifre</Label>
            <Input
              id="cp-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cp-new">Yeni şifre</Label>
              <Input
                id="cp-new"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-confirm">Yeni şifre (tekrar)</Label>
              <Input
                id="cp-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Güncelleniyor…" : "Şifreyi değiştir"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
