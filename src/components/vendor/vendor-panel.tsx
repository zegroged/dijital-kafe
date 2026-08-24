"use client";

import { useRef, useState } from "react";
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
import { SmartImage } from "@/components/ui/smart-image";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
};
type Order = {
  id: string;
  productName: string;
  buyerEmail: string;
  qty: number;
  total: number;
  vendorPayout: number;
  status: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  menuQrUrl: string | null;
};

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Ödeme bekliyor",
  paid: "Ödendi",
  processing: "İşleniyor",
  shipped: "Kargolandı",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

export function VendorPanel({
  initialProducts,
  initialOrders,
}: {
  initialProducts: Product[];
  initialOrders: Order[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  return (
    <div className="space-y-8">
      <ProductManager products={products} setProducts={setProducts} />
      <OrderManager orders={orders} setOrders={setOrders} />
    </div>
  );
}

// ---- Ürünler ----

function ProductManager({
  products,
  setProducts,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setImageUrl(null);
    setIsActive(true);
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setDescription(p.description ?? "");
    setImageUrl(p.imageUrl);
    setIsActive(p.isActive);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Görsel yüklenemedi");
        return;
      }
      setImageUrl(data.imageUrl);
    } catch {
      toast.error("Görsel yüklenirken hata oluştu");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const priceNum = Number(price);
    if (!name.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Ürün adı ve geçerli fiyat gerekli");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: priceNum,
        description: description.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        isActive,
      };
      const res = await fetch(
        editingId ? `/api/vendor/products/${editingId}` : "/api/vendor/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kaydedilemedi");
        return;
      }
      const saved: Product = { ...data.product, price: Number(data.product.price) };
      setProducts((prev) =>
        editingId
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved],
      );
      toast.success(editingId ? "Ürün güncellendi" : "Ürün eklendi");
      reset();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/vendor/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Güncellenemedi");
      return;
    }
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)),
    );
  }

  async function remove(p: Product) {
    if (!confirm(`"${p.name}" silinsin mi?`)) return;
    const res = await fetch(`/api/vendor/products/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Silinemedi");
      return;
    }
    if (data.deactivated) {
      toast.success("Siparişi olduğu için pasife alındı");
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, isActive: false } : x)),
      );
    } else {
      toast.success("Ürün silindi");
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    }
    if (editingId === p.id) reset();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Ürünler ({products.length})</h2>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Ürünü düzenle" : "Yeni ürün"}</CardTitle>
          <CardDescription>
            Fiyatı sen belirlersin. Müşteri sipariş verdiğinde platform %10 pay
            alır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Ürün adı</Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Metal QR Stand (10x10)"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Fiyat (₺)</Label>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="250"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Açıklama</Label>
              <Textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Paslanmaz çelik, lazer kazıma, masaüstü stand"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
              />
              <div className="size-14 overflow-hidden rounded-md border">
                <SmartImage
                  src={imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Yükleniyor…" : "Görsel yükle"}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Label htmlFor="p-active" className="text-sm">
                  Aktif
                </Label>
                <Switch
                  id="p-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Kaydediliyor…" : editingId ? "Güncelle" : "Ekle"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={reset}>
                  Vazgeç
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {products.length > 0 ? (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-md border">
                <SmartImage
                  src={p.imageUrl}
                  alt={p.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {p.name}{" "}
                  {!p.isActive && (
                    <span className="text-xs text-muted-foreground">
                      (pasif)
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {TRY.format(p.price)}
                </div>
              </div>
              <Switch
                checked={p.isActive}
                onCheckedChange={() => toggleActive(p)}
                aria-label="Aktif"
              />
              <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                Düzenle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(p)}>
                Sil
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ---- Siparişler ----

function OrderManager({
  orders,
  setOrders,
}: {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(o: Order, status: string) {
    setBusy(o.id);
    try {
      const res = await fetch(`/api/vendor/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Güncellenemedi");
        return;
      }
      setOrders((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, status } : x)),
      );
      toast.success(`Durum: ${STATUS_LABEL[status] ?? status}`);
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setBusy(null);
    }
  }

  function actions(o: Order) {
    if (o.status === "paid")
      return [
        { label: "İşleme al", status: "processing" },
        { label: "İptal", status: "cancelled" },
      ];
    if (o.status === "processing")
      return [
        { label: "Kargola", status: "shipped" },
        { label: "İptal", status: "cancelled" },
      ];
    if (o.status === "shipped")
      return [{ label: "Teslim edildi", status: "delivered" }];
    return [];
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Siparişler ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Henüz sipariş yok. Müşteriler ürün satın aldığında burada görünür.
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {o.productName} × {o.qty}
                </div>
                <span className="rounded-full border px-2 py-0.5 text-xs">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Toplam {TRY.format(o.total)} · Sana kalan{" "}
                {TRY.format(o.vendorPayout)}
              </div>
              {o.shippingName ? (
                <div className="mt-2 rounded-md bg-muted/40 p-2 text-sm">
                  <div className="font-medium">
                    {o.shippingName} · {o.shippingPhone}
                  </div>
                  <div className="text-muted-foreground">{o.shippingAddress}</div>
                  {o.menuQrUrl ? (
                    <div className="mt-1 text-xs">
                      Kazınacak QR:{" "}
                      <span className="font-mono">{o.menuQrUrl}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {o.status === "pending" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Ödeme tamamlanınca işleme alınabilir.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {actions(o).map((a) => (
                    <Button
                      key={a.status}
                      size="sm"
                      variant={a.status === "cancelled" ? "ghost" : "default"}
                      disabled={busy === o.id}
                      onClick={() => setStatus(o, a.status)}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
