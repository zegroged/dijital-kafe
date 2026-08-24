"use client";

import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { landingPathForRole } from "@/lib/constants";
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

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("E-posta/telefon veya şifre hatalı");
        return;
      }
      toast.success("Giriş başarılı");
      // Role göre doğru panele yönlendir (owner→/panel, admin→/admin, vb.)
      const session = await getSession();
      router.push(landingPathForRole(session?.user?.role));
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
        <CardTitle>Giriş Yap</CardTitle>
        <CardDescription>Hesabınıza giriş yapın</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">E-posta veya telefon</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="ornek@eposta.com / 05XX XXX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
          </Button>
          <p className="text-center text-sm">
            <Link
              href="/sifremi-unuttum"
              className="text-muted-foreground underline"
            >
              Şifremi unuttum
            </Link>
          </p>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-foreground underline">
            Ücretsiz başla
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
