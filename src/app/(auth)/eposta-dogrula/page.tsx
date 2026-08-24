"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type State = "verifying" | "ok" | "error";

export default function VerifyEmailPage() {
  const [state, setState] = useState<State>("verifying");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      setMsg("Bağlantı geçersiz.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d: { ok?: boolean; error?: string }) => {
        if (d.ok) setState("ok");
        else {
          setState("error");
          setMsg(d.error ?? "Doğrulanamadı.");
        }
      })
      .catch(() => {
        setState("error");
        setMsg("Bir hata oluştu, tekrar deneyin.");
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-posta doğrulama</CardTitle>
        <CardDescription>
          {state === "verifying" && "Doğrulanıyor…"}
          {state === "ok" && "E-posta adresin onaylandı 🎉"}
          {state === "error" && (msg || "Doğrulanamadı.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "ok" && (
          <p className="text-sm text-muted-foreground">
            Komisyoncu hesabın aktif. Artık referans kodun çalışıyor; müşterilerin
            kayıt olurken kodunu kullanabilir.
          </p>
        )}
        {state === "error" && (
          <p className="text-sm text-muted-foreground">
            Bağlantının süresi dolmuş olabilir. Panelinden yeni bir doğrulama maili
            isteyebilirsin.
          </p>
        )}
        {state !== "verifying" && (
          <Link href="/giris" className={buttonVariants({ className: "w-full" })}>
            Giriş yap
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
