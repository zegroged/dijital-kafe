"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { PLANS, ROOT_DOMAIN } from "@/lib/constants";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { normalizeSlug, validateSlug } from "@/lib/validations/slug";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  // Fiyatlandırma kartından gelen seçili paket (?plan=basic|premium).
  const [plan, setPlan] = useState<"basic" | "premium" | null>(null);
  // Komisyoncu referans kodu (?ref= ile ön dolu) — ZORUNLU.
  const [ref, setRef] = useState("");
  const [refError, setRefError] = useState<string | undefined>();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get("plan");
    if (p === "basic" || p === "premium") setPlan(p);
    const r = q.get("ref");
    if (r) setRef(r.toUpperCase());
  }, []);

  // İşletme adından slug türet (kullanıcı elle değiştirene kadar).
  useEffect(() => {
    if (!slugEdited) setSlug(normalizeSlug(businessName));
  }, [businessName, slugEdited]);

  const debSlug = useDebouncedValue(slug, 350);

  // Slug müsaitlik kontrolü.
  useEffect(() => {
    if (!debSlug) {
      setSlugStatus("idle");
      return;
    }
    const v = validateSlug(debSlug);
    if (!v.valid) {
      setSlugStatus("invalid");
      setSlugError(v.error);
      return;
    }
    let cancelled = false;
    setSlugStatus("checking");
    fetch(`/api/slug/check?slug=${encodeURIComponent(debSlug)}`)
      .then((r) => r.json())
      .then((d: { available: boolean; error?: string }) => {
        if (cancelled) return;
        setSlugStatus(d.available ? "available" : "taken");
        setSlugError(d.error);
      })
      .catch(() => {
        if (!cancelled) setSlugStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [debSlug]);

  const slugBlocked =
    slugStatus === "taken" ||
    slugStatus === "invalid" ||
    slugStatus === "checking";

  // Referans kodu yalnızca paralı paket seçildiğinde zorunlu (ücretsiz denemede opsiyonel).
  const requireCode = plan !== null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setRefError(undefined);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          email,
          password,
          slug,
          plan: plan ?? undefined,
          ref: ref.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.field === "ref") setRefError(data.error);
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        toast.success("Hesap oluşturuldu. Lütfen giriş yapın.");
        router.push("/giris");
        return;
      }
      toast.success("Hoş geldiniz! 🎉");
      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {plan ? `${PLANS[plan].label} hesap oluştur` : "Ücretsiz Başla"}
        </CardTitle>
        <CardDescription>
          {plan
            ? `${PLANS[plan].label} paketiyle başlıyorsun · Kredi kartı gerekmez`
            : "14 gün ücretsiz deneme · Kredi kartı gerekmez"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">İşletme adı</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Kahve Dünyası"
              required
              autoComplete="organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Menü adresiniz</Label>
            <div className="flex items-center">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(normalizeSlug(e.target.value));
                }}
                placeholder="kahve-dunyasi"
                className="rounded-r-none"
                required
              />
              <span className="inline-flex h-9 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                .{ROOT_DOMAIN}
              </span>
            </div>
            <p className="min-h-4 text-xs">
              {slugStatus === "checking" && (
                <span className="text-muted-foreground">Kontrol ediliyor…</span>
              )}
              {slugStatus === "available" && (
                <span className="text-emerald-600">✓ Bu adres müsait</span>
              )}
              {(slugStatus === "taken" || slugStatus === "invalid") && (
                <span className="text-destructive">{slugError}</span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 8 karakter"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref">
              Referans kodu{requireCode ? "" : " (opsiyonel)"}
            </Label>
            <Input
              id="ref"
              value={ref}
              onChange={(e) => {
                setRef(e.target.value.toUpperCase());
                setRefError(undefined);
              }}
              placeholder="ör. REFAB12CD"
              required={requireCode}
              autoCapitalize="characters"
              aria-invalid={refError ? true : undefined}
            />
            <div className="space-y-1">
              <p className="min-h-4 text-xs">
                {refError ? (
                  <span className="text-destructive">{refError}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {requireCode
                      ? "Paralı paket için zorunlu."
                      : "İsteğe bağlı — komisyoncunuzun kodu varsa girin."}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Referans kodunuz yoksa{" "}
                <a
                  href="mailto:info@dijitalkafe.com"
                  className="font-medium text-foreground underline"
                >
                  info@dijitalkafe.com
                </a>{" "}
                adresine mail atarak alabilirsiniz.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              submitting ||
              slugBlocked ||
              !slug ||
              (requireCode && !ref.trim())
            }
          >
            {submitting ? "Oluşturuluyor…" : "Hesap Oluştur"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-foreground underline">
            Giriş yap
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
