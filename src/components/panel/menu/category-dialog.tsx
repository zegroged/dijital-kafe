"use client";

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
import type { CategoryDTO } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDTO | null;
  onSaved: (category: CategoryDTO) => void;
}

export function CategoryDialog({ open, onOpenChange, category, onSaved }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setIcon(category?.icon ?? "");
      setImageUrl(category?.imageUrl ?? null);
    }
  }, [open, category]);

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "categories");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Görsel yüklenemedi");
        return;
      }
      setImageUrl(data.imageUrl);
    } catch {
      toast.error("Görsel yüklenirken bir hata oluştu");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        icon: icon.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
      };
      const url = category
        ? `/api/categories/${category.id}`
        : "/api/categories";
      const res = await fetch(url, {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kategori kaydedilemedi");
        return;
      }
      onSaved(data.category);
      toast.success(category ? "Kategori güncellendi" : "Kategori eklendi");
      onOpenChange(false);
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Kategoriyi Düzenle" : "Yeni Kategori"}
          </DialogTitle>
          <DialogDescription>
            Kategori adı, simge ve kapak görseli. Kategoriye özel tema için kart
            üzerindeki “Tema” butonunu kullan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Kategori adı</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kahveler"
              maxLength={80}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-icon">Simge (opsiyonel)</Label>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="☕"
              maxLength={16}
            />
          </div>

          <div className="space-y-2">
            <Label>Kapak görseli (opsiyonel)</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading
                  ? "Yükleniyor…"
                  : imageUrl
                    ? "Görseli değiştir"
                    : "Görsel yükle"}
              </Button>
              {imageUrl ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => setImageUrl(null)}
                  >
                    Kaldır
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
