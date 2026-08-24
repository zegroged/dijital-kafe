"use client";

import { useState } from "react";
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
import { SmartImage } from "@/components/ui/smart-image";
import { Textarea } from "@/components/ui/textarea";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  vendorName: string;
};
type Order = {
  id: string;
  productName: string;
  vendorName: string;
  qty: number;
  total: number;
  status: string;
};

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Ödeme bekliyor",
  paid: "Ödendi",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

export function QrStore({
  initialProducts,
  initialOrders,
  paymentEnabled,
}: {
  initialProducts: Product[];
  initialOrders: Order[];
  paymentEnabled: boolean;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selected, setSelected] = useState<Product | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  async function pay(orderId: string) {
    setPaying(orderId);
    try {
      const res = await fetch(`/api/qr-orders/${orderId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Ödeme başlatılamadı");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // İyzico ödeme sayfası
        return;
      }
      if (data.status === "paid") {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "paid" } : o)),
        );
        toast.success("Ödeme alındı, siparişin üreticiye iletildi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setPaying(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ürünler</h2>
        {initialProducts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Şu an satışta ürün yok. Üreticiler ürün ekledikçe burada görünür.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border bg-card"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  <SmartImage
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.vendorName}
                  </div>
                  {p.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-semibold">{TRY.format(p.price)}</span>
                    <Button size="sm" onClick={() => setSelected(p)}>
                      Satın al
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Siparişlerim</h2>
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Henüz sipariş vermedin.
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {o.productName} × {o.qty}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o.vendorName} · {TRY.format(o.total)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {o.status === "pending" && paymentEnabled ? (
                    <Button
                      size="sm"
                      disabled={paying === o.id}
                      onClick={() => pay(o.id)}
                    >
                      {paying === o.id ? "…" : "Öde"}
                    </Button>
                  ) : null}
                  <span className="rounded-full border px-2 py-0.5 text-xs">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <OrderDialog
        product={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onOrdered={(order) => {
          setOrders((prev) => [order, ...prev]);
          setSelected(null);
        }}
      />
    </div>
  );
}

function OrderDialog({
  product,
  onOpenChange,
  onOrdered,
}: {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onOrdered: (order: Order) => void;
}) {
  const [qty, setQty] = useState("1");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || busy) return;
    const qtyNum = Math.max(1, Number(qty) || 1);
    setBusy(true);
    try {
      const res = await fetch("/api/qr-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          qty: qtyNum,
          shippingName: name.trim(),
          shippingPhone: phone.trim(),
          shippingAddress: address.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Sipariş oluşturulamadı");
        return;
      }
      onOrdered({
        id: data.order.id,
        productName: product.name,
        vendorName: product.vendorName,
        qty: qtyNum,
        total: Number(data.order.total),
        status: data.order.status,
      });
      toast.success("Sipariş oluşturuldu. Ödeme adımı yakında eklenecek.");
      setName("");
      setPhone("");
      setAddress("");
      setQty("1");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  const total = product ? product.price * (Number(qty) || 1) : 0;

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product?.name ?? "Sipariş"}</DialogTitle>
          <DialogDescription>
            Teslimat bilgilerini gir. Menünün QR&apos;ı bu ürüne kazınacak.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="o-qty">Adet</Label>
              <Input
                id="o-qty"
                type="number"
                min={1}
                max={100}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="flex items-end justify-end pb-1 text-sm">
              Toplam: <strong className="ml-1">{TRY.format(total)}</strong>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-name">Ad Soyad</Label>
            <Input
              id="o-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-phone">Telefon</Label>
            <Input
              id="o-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-address">Adres</Label>
            <Textarea
              id="o-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Oluşturuluyor…" : "Siparişi oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
