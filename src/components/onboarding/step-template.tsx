"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PresetGrid } from "@/components/panel/theme/preset-grid";
import { ThemePreview } from "@/components/onboarding/theme-preview";
import type { PlanKey } from "@/lib/constants";
import { THEME_PRESETS, type ThemeSettings } from "@/lib/theme/schema";

function clone(t: ThemeSettings): ThemeSettings {
  return JSON.parse(JSON.stringify(t));
}

export function StepTemplate({
  onNext,
  plan,
}: {
  onNext: () => void;
  plan: PlanKey;
}) {
  const [theme, setTheme] = useState<ThemeSettings>(() =>
    clone(THEME_PRESETS[0].theme),
  );
  const [saving, setSaving] = useState(false);

  const activeKey = (() => {
    const s = JSON.stringify(theme);
    return THEME_PRESETS.find((p) => JSON.stringify(p.theme) === s)?.key;
  })();

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Tema kaydedilemedi");
        return;
      }
      toast.success("Tema kaydedildi");
      onNext();
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bir şablon seç</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Hazır bir görünüm seç — sonra panelden renk, font ve her şeyi
          değiştirebilirsin.
        </p>

        <PresetGrid activeKey={activeKey} plan={plan} onSelect={(t) => setTheme(t)} />

        <div className="space-y-2">
          <p className="text-sm font-medium">Önizleme</p>
          <ThemePreview theme={theme} />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Devam Et"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
