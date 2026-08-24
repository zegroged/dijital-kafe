"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StaffRow {
  id: string;
  name: string | null;
  phone: string | null;
  isActive: boolean;
}

export function StaffManager({ initial }: { initial: StaffRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Oluşturulamadı");
        return;
      }
      toast.success("Çalışan eklendi");
      setName("");
      setPhone("");
      setPassword("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(s: StaffRow) {
    setBusy(true);
    try {
      await fetch(`/api/staff/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: StaffRow) {
    if (!confirm(`"${s.name ?? s.phone}" çalışanını sil?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="space-y-3 rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Ad</Label>
            <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-phone">Telefon</Label>
            <Input
              id="st-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-pass">Şifre</Label>
            <Input
              id="st-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Ekleniyor…" : "Çalışan ekle"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Çalışan telefonu + şifresiyle giriş yapıp adisyon tutar.
        </p>
      </form>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz çalışan yok.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className={s.isActive ? "" : "text-muted-foreground line-through"}>
                {s.name ?? "—"}{" "}
                <span className="text-muted-foreground">{s.phone}</span>
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(s)} disabled={busy}>
                  {s.isActive ? "Pasifle" : "Aktifle"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(s)} disabled={busy}>
                  Sil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
