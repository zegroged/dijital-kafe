"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface BoardTable {
  id: string;
  name: string;
  openAdisyonId: string | null;
  openTotal: number;
}
export interface MenuGroup {
  category: string;
  dishes: { id: string; name: string; price: number }[];
}
interface DetailItem {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
}
interface Detail {
  id: string;
  tableName: string;
  items: DetailItem[];
  total: number;
}

export function AdisyonBoard({
  tables,
  menu,
  currency,
}: {
  tables: BoardTable[];
  menu: MenuGroup[];
  currency: string;
}) {
  const router = useRouter();
  const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency });
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [closing, setClosing] = useState(false);

  async function loadDetail(id: string) {
    const res = await fetch(`/api/adisyon/${id}`);
    const data = await res.json();
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Adisyon açılamadı");
      return;
    }
    const a = data.adisyon;
    setDetail({
      id: a.id,
      tableName: a.table?.name ?? "—",
      total: Number(a.total),
      items: a.items.map((i: { id: string; name: string; unitPrice: string; qty: number }) => ({
        id: i.id,
        name: i.name,
        unitPrice: Number(i.unitPrice),
        qty: i.qty,
      })),
    });
  }

  async function openTable(t: BoardTable) {
    if (busy) return;
    setBusy(true);
    try {
      if (t.openAdisyonId) {
        await loadDetail(t.openAdisyonId);
      } else {
        const res = await fetch("/api/adisyon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId: t.id }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Adisyon açılamadı");
          return;
        }
        await loadDetail(data.id);
      }
    } finally {
      setBusy(false);
    }
  }

  async function addItem(dishId: string) {
    if (!detail || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/adisyon/${detail.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId, qty: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Eklenemedi");
        return;
      }
      await loadDetail(detail.id);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!detail || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/adisyon/${detail.id}/items/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      await loadDetail(detail.id);
    } finally {
      setBusy(false);
    }
  }

  async function close(method: "cash" | "card") {
    if (!detail || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/adisyon/${detail.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kapatılamadı");
        return;
      }
      toast.success(`Adisyon kapatıldı (${method === "cash" ? "Nakit" : "Kart"})`);
      back();
    } finally {
      setBusy(false);
    }
  }

  function back() {
    setDetail(null);
    setPicker(false);
    setClosing(false);
    router.refresh();
  }

  // --- Adisyon detayı ---
  if (detail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={back} className="text-sm text-muted-foreground underline">
            ← Masalar
          </button>
          <h2 className="font-semibold">{detail.tableName}</h2>
        </div>

        <div className="rounded-lg border">
          {detail.items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Henüz ürün yok. &quot;Ürün ekle&quot; ile başla.
            </p>
          ) : (
            <ul className="divide-y">
              {detail.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="flex-1">
                    {i.name}{" "}
                    <span className="text-muted-foreground">×{i.qty}</span>
                  </span>
                  <span className="tabular-nums">{fmt.format(i.unitPrice * i.qty)}</span>
                  <button
                    onClick={() => removeItem(i.id)}
                    disabled={busy}
                    className="text-destructive"
                    aria-label="Kaldır"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-2 font-semibold">
            <span>Toplam</span>
            <span className="tabular-nums">{fmt.format(detail.total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setPicker((v) => !v)} disabled={busy}>
            {picker ? "Menüyü kapat" : "+ Ürün ekle"}
          </Button>
          {detail.items.length > 0 &&
            (closing ? (
              <>
                <Button onClick={() => close("cash")} disabled={busy}>
                  Nakit al
                </Button>
                <Button onClick={() => close("card")} disabled={busy}>
                  Kart ile al
                </Button>
                <Button variant="outline" onClick={() => setClosing(false)} disabled={busy}>
                  Vazgeç
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={() => setClosing(true)} disabled={busy}>
                Hesabı kapat
              </Button>
            ))}
        </div>

        {picker && (
          <div className="space-y-4 rounded-lg border p-3">
            {menu.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Menüde ürün yok. Önce menünü oluştur.
              </p>
            ) : (
              menu.map((g) => (
                <div key={g.category}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {g.category}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {g.dishes.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => addItem(d.id)}
                        disabled={busy}
                        className="rounded-lg border p-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                      >
                        <span className="block font-medium leading-tight">{d.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmt.format(d.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Masa ızgarası ---
  return (
    <div>
      {tables.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Henüz masa yok. Patron panelinden &quot;Masalar&quot; ile masa ekleyin.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => {
            const open = t.openAdisyonId !== null;
            return (
              <button
                key={t.id}
                onClick={() => openTable(t)}
                disabled={busy}
                className={
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition disabled:opacity-50 " +
                  (open
                    ? "border-primary bg-primary/10"
                    : "border-input hover:bg-accent")
                }
              >
                <span className="text-base font-semibold">{t.name}</span>
                {open ? (
                  <span className="text-sm font-medium text-primary">
                    {fmt.format(t.openTotal)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">boş</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
