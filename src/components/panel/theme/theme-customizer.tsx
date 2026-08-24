"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/constants";
import { parseTheme, type ThemeSettings } from "@/lib/theme/schema";
import { ThemeControls } from "./theme-controls";
import { ThemePreview } from "./theme-preview";

// Basit derin kopya (tema saf JSON yapısı olduğu için yeterli).
function clone(theme: ThemeSettings): ThemeSettings {
  return JSON.parse(JSON.stringify(theme));
}

// Tema nereye kaydedilecek: genel menü teması mı, bir kategorinin teması mı.
export type ThemeTarget =
  | { kind: "menu" }
  | { kind: "category"; categoryId: string; hasOwnTheme: boolean };

export function ThemeCustomizer({
  initialTheme,
  target = { kind: "menu" },
  plan,
}: {
  initialTheme: ThemeSettings;
  target?: ThemeTarget;
  plan: PlanKey;
}) {
  const router = useRouter();
  // Sunucudan gelen değer = referans. "Sıfırla" buna döner.
  const [saved, setSaved] = useState<ThemeSettings>(() => clone(initialTheme));
  // Önizleme/düzenleme için yerel taslak. Kaydedilene kadar kalıcı değil.
  const [draft, setDraft] = useState<ThemeSettings>(() => clone(initialTheme));
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  // Taslağı immutably güncelleyen yardımcı (mutate eden callback alır).
  const update = useCallback(
    (mutate: (d: ThemeSettings) => void) => {
      setDraft((prev) => {
        const next = clone(prev);
        mutate(next);
        return next;
      });
    },
    [],
  );

  // Sayfadan ayrılırken kaydedilmemiş değişiklik uyarısı.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const url =
        target.kind === "menu"
          ? "/api/theme"
          : `/api/categories/${target.categoryId}`;
      const payload =
        target.kind === "menu"
          ? { theme: draft }
          : { themeSettings: draft };
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Tema kaydedilemedi");
        return;
      }
      // Sunucunun döndürdüğü (doğrulanmış) temayı referans yap.
      const next =
        target.kind === "menu"
          ? (data.theme as ThemeSettings)
          : parseTheme(data.category?.themeSettings);
      setSaved(clone(next));
      setDraft(clone(next));
      toast.success("Tema kaydedildi");
    } catch {
      toast.error("Tema kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setDraft(clone(saved));
    toast.info("Kaydedilmemiş değişiklikler geri alındı");
  }

  // Kategori: kendi temasını sil → menü temasını miras al.
  async function onInherit() {
    if (saving || target.kind !== "category") return;
    if (
      !confirm("Bu kategori menü temasını kullanacak. Özel tema silinsin mi?")
    )
      return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${target.categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeSettings: null }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "İşlem başarısız");
        return;
      }
      toast.success("Kategori artık menü temasını kullanıyor");
      router.push("/panel/menu");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Eylem çubuğu */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          {dirty ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
              ● Kaydedilmemiş değişiklik var
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Tüm değişiklikler kaydedildi
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {target.kind === "category" && target.hasOwnTheme ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onInherit}
              disabled={saving}
              className="text-muted-foreground"
            >
              Menü temasına dön
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!dirty || saving}
          >
            Sıfırla
          </Button>
          <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        {/* Kontroller */}
        <div>
          <ThemeControls theme={draft} update={update} plan={plan} />
        </div>

        {/* Canlı önizleme */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 text-sm font-medium text-muted-foreground">
            Canlı önizleme
          </div>
          <ThemePreview theme={draft} />
        </div>
      </div>
    </div>
  );
}
