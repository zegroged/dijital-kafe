"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableRow {
  id: string;
  name: string;
  isActive: boolean;
}

export function TableManager({ initial }: { initial: TableRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Eklenemedi");
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(t: TableRow) {
    setBusy(true);
    try {
      await fetch(`/api/tables/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: TableRow) {
    if (!confirm(`"${t.name}" masasını sil?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tables/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masa adı (örn. Masa 1, Bahçe 3)"
          className="max-w-xs"
        />
        <Button type="submit" disabled={busy || !name.trim()}>
          Ekle
        </Button>
      </form>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz masa yok.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className={t.isActive ? "" : "text-muted-foreground line-through"}>
                {t.name}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggle(t)}
                  disabled={busy}
                >
                  {t.isActive ? "Pasifle" : "Aktifle"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(t)}
                  disabled={busy}
                >
                  Sil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
