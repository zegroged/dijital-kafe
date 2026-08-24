"use client";

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

// Admin: komisyoncu, QR üretici ve komisyon yöneticisi hesabı oluşturma formları.
export function AdminForms() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CreateAffiliate />
      <CreateVendor />
      <CreateAffiliateManager />
      <CreateAccountant />
    </div>
  );
}

type CommissionType = "one_time" | "recurring";

// Kazanç tipi için segmented seçenek kutusu.
function TypeOption({
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

// Komisyoncu oluşturma formu. Hem admin hem komisyon yöneticisi panelinde kullanılır.
export function CreateAffiliate() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [commissionType, setCommissionType] =
    useState<CommissionType>("one_time");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password,
          name: name || undefined,
          code: code || undefined,
          commissionType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Oluşturulamadı");
        return;
      }
      toast.success(
        `Komisyoncu oluşturuldu · kod: ${data.code}. Komisyoncu ilk girişte e-postasını doğrulayınca kod aktifleşir.`,
      );
      setPhone("");
      setPassword("");
      setName("");
      setCode("");
      setCommissionType("one_time");
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
        <CardTitle>Komisyoncu ekle</CardTitle>
        <CardDescription>
          Hesap + referans kodu oluşturur (boş bırakırsan kod üretilir). E-posta
          GİRİLMEZ: komisyoncu ilk girişte kendi panelinden e-postasını doğrular
          → ancak o zaman kodu aktifleşir. Giriş telefonla yapılır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Kazanç tipi</Label>
            <div className="grid grid-cols-2 gap-2">
              <TypeOption
                active={commissionType === "one_time"}
                onClick={() => setCommissionType("one_time")}
                title="Tek seferlik"
                desc="İlk ödemeden bir kez %70"
              />
              <TypeOption
                active={commissionType === "recurring"}
                onClick={() => setCommissionType("recurring")}
                title="Devam eden"
                desc="İptal edene dek her ödemeden %30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aff-phone">Telefon</Label>
            <Input
              id="aff-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="aff-pass">Şifre</Label>
              <Input
                id="aff-pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aff-code">Kod (opsiyonel)</Label>
              <Input
                id="aff-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="AHMET2026"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aff-name">Ad (opsiyonel)</Label>
            <Input
              id="aff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Oluşturuluyor…" : "Komisyoncu oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateVendor() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, companyName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Oluşturulamadı");
        return;
      }
      toast.success("QR üretici oluşturuldu");
      setEmail("");
      setPassword("");
      setCompanyName("");
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
        <CardTitle>QR üretici ekle</CardTitle>
        <CardDescription>
          Lazer kazıma firması hesabı. Kendi ürün/fiyatını yönetir; biz %10 pay
          alırız.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ven-company">Firma adı</Label>
            <Input
              id="ven-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ven-email">E-posta</Label>
              <Input
                id="ven-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ven-pass">Şifre</Label>
              <Input
                id="ven-pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Oluşturuluyor…" : "Üretici oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Admin: komisyon yöneticisi hesabı (yalnız komisyoncu açabilen ayrı kullanıcı).
function CreateAffiliateManager() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/affiliate-managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Oluşturulamadı");
        return;
      }
      toast.success("Komisyon yöneticisi oluşturuldu");
      setEmail("");
      setPassword("");
      setName("");
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
        <CardTitle>Komisyon yöneticisi ekle</CardTitle>
        <CardDescription>
          Bu kişi yalnızca komisyoncu hesabı açabilir; başka veriye erişemez.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mgr-email">E-posta</Label>
            <Input
              id="mgr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mgr-pass">Şifre</Label>
              <Input
                id="mgr-pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgr-name">Ad (opsiyonel)</Label>
              <Input
                id="mgr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Oluşturuluyor…" : "Yönetici oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Admin: mali müşavir hesabı (stopaj oranı + gider pusulası + vergi raporları).
function CreateAccountant() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/accountants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Oluşturulamadı");
        return;
      }
      toast.success("Mali müşavir oluşturuldu");
      setEmail("");
      setPassword("");
      setName("");
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
        <CardTitle>Mali müşavir ekle</CardTitle>
        <CardDescription>
          Stopaj oranını ayarlar, gider pusulası/fatura kaydını işler, vergi
          raporu alır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="acc-email">E-posta</Label>
            <Input
              id="acc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-pass">Şifre</Label>
              <Input
                id="acc-pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Ad (opsiyonel)</Label>
              <Input
                id="acc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Oluşturuluyor…" : "Mali müşavir oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
