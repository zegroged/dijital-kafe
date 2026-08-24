"use client";

import {
  ImageIcon,
  Loader2Icon,
  RotateCcwIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartImage } from "@/components/ui/smart-image";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryDTO, DishDTO } from "./types";

const NONE_VALUE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null → yeni yemek, dolu → düzenleme
  dish: DishDTO | null;
  categories: CategoryDTO[];
  // Yeni yemek eklenirken ön-seçili kategori
  defaultCategoryId?: string | null;
  // Nano Banana (AI görsel canlandırma) yapılandırılmış mı?
  aiEnhanceEnabled: boolean;
  onSaved: (dish: DishDTO) => void;
}

export function DishDialog({
  open,
  onOpenChange,
  dish,
  categories,
  defaultCategoryId,
  aiEnhanceEnabled,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  // AI ile güçlendirildiyse orijinal burada saklanır (tahribatsızlık + geri dönüş).
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Hangi seçenekle dosya seçiliyor: "enhance" (AI ile güçlendir) | "plain" (olduğu gibi)
  const modeRef = useRef<"enhance" | "plain">("plain");

  // Dialog her açıldığında formu doldur.
  useEffect(() => {
    if (!open) return;
    setName(dish?.name ?? "");
    setDescription(dish?.description ?? "");
    setPrice(dish ? String(dish.price) : "");
    setCategoryId(dish ? dish.categoryId : (defaultCategoryId ?? null));
    setImageUrl(dish?.imageUrl ?? null);
    setThumbnailUrl(dish?.thumbnailUrl ?? null);
    setOriginalImageUrl(dish?.originalImageUrl ?? null);
    setIsAvailable(dish?.isAvailable ?? true);
    setUploading(false);
    setEnhancing(false);
  }, [open, dish, defaultCategoryId]);

  function pick(mode: "enhance" | "plain") {
    modeRef.current = mode;
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const mode = modeRef.current;

    // 1) Önce orijinali yükle.
    setUploading(true);
    let uploaded: { imageUrl: string; thumbnailUrl: string };
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "dishes");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Görsel yüklenemedi");
        return;
      }
      uploaded = { imageUrl: data.imageUrl, thumbnailUrl: data.thumbnailUrl };
    } catch {
      toast.error("Görsel yüklenirken hata oluştu.");
      return;
    } finally {
      setUploading(false);
    }

    // 2) "Olduğu gibi" → orijinali kullan, bitti.
    if (mode === "plain" || !aiEnhanceEnabled) {
      setOriginalImageUrl(null);
      setImageUrl(uploaded.imageUrl);
      setThumbnailUrl(uploaded.thumbnailUrl);
      return;
    }

    // 3) "AI ile güçlendir" → arka planda canlandır, sadece sonucu göster.
    setEnhancing(true);
    try {
      const res = await fetch("/api/dishes/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploaded.imageUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Kota dolu / hata → orijinali kullan, sebebi bildir.
        toast.error(data.error ?? "Görsel güçlendirilemedi, orijinal kullanıldı");
        setOriginalImageUrl(null);
        setImageUrl(uploaded.imageUrl);
        setThumbnailUrl(uploaded.thumbnailUrl);
        return;
      }
      // Sadece güçlendirilmiş sonucu göster; orijinali sakla.
      setOriginalImageUrl(uploaded.imageUrl);
      setImageUrl(data.imageUrl);
      setThumbnailUrl(data.thumbnailUrl);
      toast.success("Fotoğraf AI ile güçlendirildi");
    } catch {
      toast.error("Bir hata oluştu, orijinal görsel kullanıldı.");
      setOriginalImageUrl(null);
      setImageUrl(uploaded.imageUrl);
      setThumbnailUrl(uploaded.thumbnailUrl);
    } finally {
      setEnhancing(false);
    }
  }

  function removeImage() {
    setImageUrl(null);
    setThumbnailUrl(null);
    setOriginalImageUrl(null);
  }

  function revertOriginal() {
    if (!originalImageUrl) return;
    setImageUrl(originalImageUrl);
    setThumbnailUrl(originalImageUrl);
    setOriginalImageUrl(null);
    toast.success("Orijinal fotoğrafa dönüldü");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Geçerli bir fiyat girin.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        categoryId: categoryId,
        imageUrl: imageUrl ?? undefined,
        thumbnailUrl: thumbnailUrl ?? undefined,
        originalImageUrl: originalImageUrl,
        isAvailable,
      };
      const url = dish ? `/api/dishes/${dish.id}` : "/api/dishes";
      const res = await fetch(url, {
        method: dish ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Yemek kaydedilemedi");
        return;
      }
      const saved: DishDTO = { ...data.dish, price: Number(data.dish.price) };
      onSaved(saved);
      toast.success(dish ? "Yemek güncellendi" : "Yemek eklendi");
      onOpenChange(false);
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const busy = uploading || enhancing;
  const isEnhanced = Boolean(originalImageUrl && originalImageUrl !== imageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dish ? "Yemeği Düzenle" : "Yeni Yemek"}</DialogTitle>
          <DialogDescription>
            Yemeğin adını, fiyatını ve görselini girin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dish-name">Yemek adı</Label>
            <Input
              id="dish-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Margherita Pizza"
              maxLength={120}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dish-desc">Açıklama (opsiyonel)</Label>
            <Textarea
              id="dish-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Domates sosu, mozzarella, fesleğen"
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dish-price">Fiyat (₺)</Label>
              <Input
                id="dish-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={categoryId ?? NONE_VALUE}
                onValueChange={(v) =>
                  setCategoryId(v === NONE_VALUE ? null : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kategori seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Kategorisiz</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ""}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Görsel (opsiyonel)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />

            {/* Yükleme / güçlendirme sürerken */}
            {busy ? (
              <div className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
                <Loader2Icon className="size-5 animate-spin" />
                {enhancing
                  ? "✨ Yapay zeka fotoğrafı güçlendiriyor…"
                  : "Yükleniyor…"}
              </div>
            ) : imageUrl ? (
              <>
                <div className="relative w-full overflow-hidden rounded-lg border">
                  <SmartImage
                    src={imageUrl}
                    alt="Önizleme"
                    className="aspect-video w-full object-cover"
                    fallbackClassName="aspect-video bg-muted"
                  />
                  {isEnhanced ? (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
                      <SparklesIcon className="size-3 text-[#FFB078]" />
                      AI ile güçlendirildi
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <XIcon />
                    <span className="sr-only">Görseli kaldır</span>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {aiEnhanceEnabled ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => pick("enhance")}
                    >
                      <SparklesIcon className="text-[#FF6B35]" />
                      AI ile güçlendir & değiştir
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => pick("plain")}
                  >
                    <UploadIcon />
                    Orijinali yükle
                  </Button>
                  {isEnhanced ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={revertOriginal}
                    >
                      <RotateCcwIcon />
                      Orijinale dön
                    </Button>
                  ) : null}
                </div>
              </>
            ) : aiEnhanceEnabled ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="h-auto w-full flex-col gap-0.5 py-2.5"
                  onClick={() => pick("enhance")}
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <SparklesIcon />
                    En gelişmiş AI ile güçlendir
                  </span>
                  <span className="text-[11px] font-normal opacity-80">
                    Renk ve ışığı canlandırır, içeriği değiştirmez
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => pick("plain")}
                >
                  <ImageIcon />
                  Fotoğrafı olduğu gibi yükle
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-24 w-full flex-col gap-2 border-dashed"
                onClick={() => pick("plain")}
              >
                <ImageIcon />
                Görsel yükle
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="dish-available">Menüde göster</Label>
              <p className="text-xs text-muted-foreground">
                Kapalıysa müşteriye gösterilmez.
              </p>
            </div>
            <Switch
              id="dish-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={saving || busy || !name.trim()}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
