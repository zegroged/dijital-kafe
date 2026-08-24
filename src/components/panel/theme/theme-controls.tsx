"use client";

import { LockIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlanKey } from "@/lib/constants";
import { isFullColorAllowed } from "@/lib/theme/entitlements";
import {
  FONT_PAIRS,
  PALETTES,
  TEMPLATES,
  THEME_PRESETS,
  type ThemeSettings,
} from "@/lib/theme/schema";
import { cn } from "@/lib/utils";
import { ColorInput, Field, Segmented } from "./controls";
import { PresetGrid } from "./preset-grid";

type Updater = (mutate: (draft: ThemeSettings) => void) => void;

const RADIUS_OPTS = [
  { value: "none", label: "Yok" },
  { value: "sm", label: "Az" },
  { value: "md", label: "Orta" },
  { value: "lg", label: "Çok" },
] as const;

const SHADOW_OPTS = [
  { value: "none", label: "Yok" },
  { value: "sm", label: "Hafif" },
  { value: "md", label: "Orta" },
  { value: "lg", label: "Belirgin" },
] as const;

const COLOR_FIELDS: { key: keyof ThemeSettings["colors"]; label: string }[] = [
  { key: "primary", label: "Ana renk" },
  { key: "secondary", label: "İkincil" },
  { key: "background", label: "Arka plan" },
  { key: "text", label: "Metin" },
  { key: "accent", label: "Vurgu" },
  { key: "card_bg", label: "Kart zemini" },
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #FF6B35, #F7C59F)",
  "linear-gradient(135deg, #0077B6, #00B4D8)",
  "linear-gradient(135deg, #2D6A4F, #95D5B2)",
  "linear-gradient(135deg, #7B2CBF, #C77DFF)",
  "linear-gradient(135deg, #1A1A1A, #434343)",
];

export function ThemeControls({
  theme,
  update,
  plan,
}: {
  theme: ThemeSettings;
  update: Updater;
  plan: PlanKey;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const fullColor = isFullColorAllowed(plan);

  async function onUploadBackground(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "backgrounds");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Görsel yüklenemedi");
        return;
      }
      update((d) => {
        d.background.type = "image";
        d.background.value = data.imageUrl;
      });
    } catch {
      toast.error("Görsel yüklenirken bir hata oluştu");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Hazır şablon uygula: tüm temayı değiştir (gelen theme zaten klonlanmış).
  function applyPreset(next: ThemeSettings) {
    update((d) => {
      d.template = next.template;
      d.colors = next.colors;
      d.font = next.font;
      d.card_style = next.card_style;
      d.button_style = next.button_style;
      d.background = next.background;
    });
  }

  // Mevcut tema bir preset ile birebir aynıysa onu vurgula.
  const activedraft = JSON.stringify(theme);
  const activePreset = THEME_PRESETS.find(
    (p) => JSON.stringify(p.theme) === activedraft,
  )?.key;

  return (
    <div className="space-y-4">
      {/* Hazır Şablonlar */}
      <Card>
        <CardHeader>
          <CardTitle>Hazır Şablonlar</CardTitle>
          <CardDescription>
            Tek tıkla profesyonel bir görünüm uygula, sonra dilediğini değiştir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PresetGrid
            activeKey={activePreset}
            plan={plan}
            onSelect={applyPreset}
          />
        </CardContent>
      </Card>

      {/* Şablon */}
      <Card>
        <CardHeader>
          <CardTitle>Şablon</CardTitle>
          <CardDescription>Hazır başlangıç görünümü.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATES.map((t) => {
              const active = theme.template === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() =>
                    update((d) => {
                      d.template = t.key;
                    })
                  }
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Renkler */}
      <Card>
        <CardHeader>
          <CardTitle>Renkler</CardTitle>
          <CardDescription>
            Hazır bir palet seç veya renkleri tek tek ayarla.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Hazır paletler">
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  title={p.name}
                  onClick={() =>
                    update((d) => {
                      d.colors.primary = p.primary;
                      d.colors.secondary = p.secondary;
                      d.colors.background = p.background;
                      d.colors.accent = p.primary;
                      if (d.background.type === "solid") {
                        d.background.value = p.background;
                      }
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <span className="flex">
                    {[p.primary, p.secondary, p.background].map((c, i) => (
                      <span
                        key={i}
                        className="size-4 rounded-full border border-black/10"
                        style={{
                          background: c,
                          marginLeft: i === 0 ? 0 : -6,
                        }}
                      />
                    ))}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </Field>

          {fullColor ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <ColorInput
                    value={theme.colors[f.key]}
                    onChange={(value) =>
                      update((d) => {
                        d.colors[f.key] = value;
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <LockIcon className="size-3.5 shrink-0" />
              <span>
                Her rengi tek tek seçmek (tam spektrum){" "}
                <strong>Premium</strong>&apos;a özel. Şimdilik yukarıdaki hazır
                paletlerden seçebilirsin.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yazı tipi */}
      <Card>
        <CardHeader>
          <CardTitle>Yazı Tipi</CardTitle>
          <CardDescription>Font kombinasyonu ve boyut ölçeği.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Kombinasyon">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FONT_PAIRS.map((fp) => {
                const active =
                  theme.font.heading === fp.heading &&
                  theme.font.body === fp.body;
                return (
                  <button
                    key={fp.name}
                    type="button"
                    onClick={() =>
                      update((d) => {
                        d.font.heading = fp.heading;
                        d.font.body = fp.body;
                      })
                    }
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/10"
                        : "hover:bg-muted",
                    )}
                  >
                    <div className="text-sm font-semibold">{fp.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {fp.heading} · {fp.body}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Boyut ölçeği">
            <Segmented
              value={theme.font.scale}
              onChange={(value) =>
                update((d) => {
                  d.font.scale = value;
                })
              }
              options={[
                { value: "sm", label: "Küçük" },
                { value: "md", label: "Orta" },
                { value: "lg", label: "Büyük" },
                { value: "xl", label: "Çok Büyük" },
              ]}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Kart stili */}
      <Card>
        <CardHeader>
          <CardTitle>Kart Stili</CardTitle>
          <CardDescription>Köşe yuvarlaklığı, gölge ve düzen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Köşe yuvarlaklığı">
            <Segmented
              value={theme.card_style.border_radius}
              onChange={(value) =>
                update((d) => {
                  d.card_style.border_radius = value;
                })
              }
              options={RADIUS_OPTS}
            />
          </Field>
          <Field label="Gölge">
            <Segmented
              value={theme.card_style.shadow}
              onChange={(value) =>
                update((d) => {
                  d.card_style.shadow = value;
                })
              }
              options={SHADOW_OPTS}
            />
          </Field>
          <Field label="Düzen">
            <Segmented
              value={theme.card_style.layout}
              onChange={(value) =>
                update((d) => {
                  d.card_style.layout = value;
                })
              }
              options={[
                { value: "grid", label: "Izgara" },
                { value: "list", label: "Liste" },
              ]}
            />
          </Field>
          <Field label="Kenar çizgisi" hint="Kartların kenarından geçen ince çizgi.">
            <Segmented
              value={theme.card_style.border}
              onChange={(value) =>
                update((d) => {
                  d.card_style.border = value;
                })
              }
              options={[
                { value: "none", label: "Yok" },
                { value: "hairline", label: "İnce" },
                { value: "accent", label: "Aksan" },
                { value: "inset", label: "İç çerçeve" },
              ]}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Buton stili */}
      <Card>
        <CardHeader>
          <CardTitle>Buton Stili</CardTitle>
          <CardDescription>Köşe yuvarlaklığı ve görünüm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Köşe yuvarlaklığı">
            <Segmented
              value={theme.button_style.border_radius}
              onChange={(value) =>
                update((d) => {
                  d.button_style.border_radius = value;
                })
              }
              options={RADIUS_OPTS}
            />
          </Field>
          <Field label="Görünüm">
            <Segmented
              value={theme.button_style.variant}
              onChange={(value) =>
                update((d) => {
                  d.button_style.variant = value;
                })
              }
              options={[
                { value: "filled", label: "Dolu" },
                { value: "outline", label: "Çerçeveli" },
                { value: "ghost", label: "Sade" },
              ]}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Arka plan */}
      <Card>
        <CardHeader>
          <CardTitle>Arka Plan</CardTitle>
          <CardDescription>Düz renk, gradyan veya görsel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Tür">
            <Segmented
              value={theme.background.type}
              onChange={(value) =>
                update((d) => {
                  d.background.type = value;
                  if (value === "solid") d.background.value = d.colors.background;
                  else if (value === "gradient")
                    d.background.value = GRADIENT_PRESETS[0];
                  else d.background.value = "";
                })
              }
              options={[
                { value: "solid", label: "Düz Renk" },
                { value: "gradient", label: "Gradyan" },
                { value: "image", label: "Görsel" },
              ]}
            />
          </Field>

          {theme.background.type === "solid" &&
            (fullColor ? (
              <Field label="Renk">
                <ColorInput
                  value={theme.background.value || theme.colors.background}
                  onChange={(value) =>
                    update((d) => {
                      d.background.value = value;
                    })
                  }
                />
              </Field>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                <LockIcon className="size-3.5 shrink-0" />
                <span>
                  Arka plan rengi seçtiğin paletle değişir. Özel renk{" "}
                  <strong>Premium</strong>&apos;da.
                </span>
              </div>
            ))}

          {theme.background.type === "gradient" && (
            <Field label="Gradyan" hint="Hazır bir gradyan seç.">
              <div className="flex flex-wrap gap-2">
                {GRADIENT_PRESETS.map((g) => {
                  const active = theme.background.value === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        update((d) => {
                          d.background.value = g;
                        })
                      }
                      aria-pressed={active}
                      style={{ background: g }}
                      className={cn(
                        "size-12 rounded-lg border-2 transition-all",
                        active
                          ? "border-foreground ring-2 ring-ring/40"
                          : "border-transparent hover:scale-105",
                      )}
                    />
                  );
                })}
              </div>
            </Field>
          )}

          {theme.background.type === "image" && (
            <Field label="Görsel" hint="JPEG, PNG veya WebP · en fazla 10MB.">
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadBackground(file);
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {uploading
                    ? "Yükleniyor…"
                    : theme.background.value
                      ? "Görseli değiştir"
                      : "Görsel yükle"}
                </button>
                {theme.background.value ? (
                  <div
                    className="size-12 shrink-0 rounded-lg border bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${theme.background.value}")`,
                    }}
                  />
                ) : null}
              </div>
            </Field>
          )}

          <Field label="Arka plan efekti" hint="Işıltı veya ince çerçeve — afilli VIP his.">
            <Segmented
              value={theme.decor}
              onChange={(value) =>
                update((d) => {
                  d.decor = value;
                })
              }
              options={[
                { value: "none", label: "Yok" },
                { value: "glow", label: "Işıltı" },
                { value: "frame", label: "Çerçeve" },
              ]}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
