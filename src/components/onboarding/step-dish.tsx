"use client";

import { ImageIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartImage } from "@/components/ui/smart-image";

type UploadResult = {
  ok?: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
};

type CategoriesResult = {
  ok?: boolean;
  categories?: Array<{ id: string }>;
};

export function StepDish({
  onNext,
  onBack,
  aiEnhanceEnabled,
}: {
  onNext: () => void;
  onBack: () => void;
  aiEnhanceEnabled: boolean;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<"enhance" | "plain">("plain");

  function pick(mode: "enhance" | "plain") {
    modeRef.current = mode;
    fileRef.current?.click();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const mode = modeRef.current;

    setUploading(true);
    let uploaded: { imageUrl: string; thumbnailUrl: string };
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "dishes");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data: UploadResult = await res.json();
      if (!res.ok || !data.ok || !data.imageUrl) {
        toast.error(data.error ?? "Görsel yüklenemedi");
        return;
      }
      uploaded = {
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl ?? data.imageUrl,
      };
    } catch {
      toast.error("Görsel yüklenirken hata oluştu.");
      return;
    } finally {
      setUploading(false);
    }

    if (mode === "plain" || !aiEnhanceEnabled) {
      setOriginalImageUrl(null);
      setImageUrl(uploaded.imageUrl);
      setThumbnailUrl(uploaded.thumbnailUrl);
      toast.success("Görsel yüklendi");
      return;
    }

    setEnhancing(true);
    try {
      const res = await fetch("/api/dishes/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploaded.imageUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Güçlendirilemedi, orijinal kullanıldı");
        setOriginalImageUrl(null);
        setImageUrl(uploaded.imageUrl);
        setThumbnailUrl(uploaded.thumbnailUrl);
        return;
      }
      setOriginalImageUrl(uploaded.imageUrl);
      setImageUrl(data.imageUrl);
      setThumbnailUrl(data.thumbnailUrl);
      toast.success("Fotoğraf AI ile güçlendirildi");
    } catch {
      toast.error("Bir hata oluştu, orijinal kullanıldı.");
      setOriginalImageUrl(null);
      setImageUrl(uploaded.imageUrl);
      setThumbnailUrl(uploaded.thumbnailUrl);
    } finally {
      setEnhancing(false);
    }
  }

  async function onSave() {
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Yemek adı gerekli");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Geçerli bir fiyat girin");
      return;
    }
    setSaving(true);
    try {
      // İlk kategoriyi al (varsa yemeği ona bağla).
      const catRes = await fetch("/api/categories");
      const catData: CategoriesResult = await catRes.json();
      const categoryId = catData.categories?.[0]?.id ?? null;

      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          price: priceNum,
          categoryId,
          imageUrl: imageUrl ?? undefined,
          thumbnailUrl: thumbnailUrl ?? undefined,
          originalImageUrl: originalImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Yemek eklenemedi");
        return;
      }
      toast.success("İlk yemeğin eklendi");
      onNext();
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const busy = uploading || enhancing;
  const isEnhanced = Boolean(originalImageUrl && originalImageUrl !== imageUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>İlk yemeğini ekle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="dishName">Yemek adı</Label>
          <Input
            id="dishName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Türk Kahvesi"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dishPrice">Fiyat (₺)</Label>
          <Input
            id="dishPrice"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="45"
          />
        </div>

        <div className="space-y-2">
          <Label>Görsel (opsiyonel)</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <div className="relative size-16 shrink-0">
              <SmartImage
                src={thumbnailUrl}
                alt="Yemek görseli"
                className="size-16 rounded-md object-cover ring-1 ring-foreground/10"
                fallbackClassName="rounded-md bg-muted"
                fallback={<span className="text-xs text-muted-foreground">Yok</span>}
              />
              {isEnhanced ? (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-black/70 p-1">
                  <SparklesIcon className="size-3 text-[#FFB078]" />
                </span>
              ) : null}
            </div>

            {busy ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                {enhancing ? "✨ AI güçlendiriyor…" : "Yükleniyor…"}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {aiEnhanceEnabled ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => pick("enhance")}
                  >
                    <SparklesIcon />
                    AI ile güçlendir
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => pick("plain")}
                >
                  <ImageIcon />
                  {thumbnailUrl ? "Değiştir" : "Olduğu gibi yükle"}
                </Button>
              </div>
            )}
          </div>
          {aiEnhanceEnabled ? (
            <p className="text-xs text-muted-foreground">
              ✨ AI, fotoğrafın renk ve ışığını içeriği değiştirmeden canlandırır.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Geri
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onNext}
              disabled={saving || busy}
            >
              Daha sonra eklerim
            </Button>
            <Button onClick={onSave} disabled={saving || busy}>
              {saving ? "Ekleniyor…" : "Devam Et"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
