"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ExternalLinkIcon,
  FolderPlusIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ROOT_DOMAIN } from "@/lib/constants";
import type { ModelStatus } from "@/generated/prisma/client";
import { CategoryDialog } from "./category-dialog";
import { DishCard } from "./dish-card";
import { DishDialog } from "./dish-dialog";
import type { CategoryDTO, DishDTO } from "./types";

const UNCATEGORIZED = "__uncategorized__";
const POLL_INTERVAL_MS = 3000;

interface Props {
  initialCategories: CategoryDTO[];
  initialDishes: DishDTO[];
  arcodeEnabled: boolean;
  aiEnhanceEnabled: boolean;
  quota: number;
  aiEnhanceQuota: number;
  isPublished: boolean;
  slug: string | null;
}

export function MenuBuilder({
  initialCategories,
  initialDishes,
  arcodeEnabled,
  aiEnhanceEnabled,
  quota,
  aiEnhanceQuota,
  isPublished: initialPublished,
  slug,
}: Props) {
  const [categories, setCategories] = useState<CategoryDTO[]>(initialCategories);
  const [dishes, setDishes] = useState<DishDTO[]>(initialDishes);
  const [published, setPublished] = useState(initialPublished);
  const [publishing, setPublishing] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState(quota);
  const [busyModels, setBusyModels] = useState<Set<string>>(new Set());

  // Aktif 3D poll zamanlayıcıları (dishId → timeoutId). İptal + unmount temizliği.
  const pollTimers = useRef<Map<string, number>>(new Map());
  const stopPoll = useCallback((dishId: string) => {
    const id = pollTimers.current.get(dishId);
    if (id !== undefined) window.clearTimeout(id);
    pollTimers.current.delete(dishId);
  }, []);
  useEffect(() => {
    const timers = pollTimers.current;
    return () => {
      for (const id of timers.values()) window.clearTimeout(id);
      timers.clear();
    };
  }, []);

  // Dialog durumları
  const [catDialog, setCatDialog] = useState<{
    open: boolean;
    category: CategoryDTO | null;
  }>({ open: false, category: null });
  const [dishDialog, setDishDialog] = useState<{
    open: boolean;
    dish: DishDTO | null;
    defaultCategoryId: string | null;
  }>({ open: false, dish: null, defaultCategoryId: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Yemekleri kategoriye göre grupla (kategorisizler en sona).
  const groups = useMemo(() => {
    const byCat = new Map<string, DishDTO[]>();
    for (const d of dishes) {
      const key = d.categoryId ?? UNCATEGORIZED;
      const arr = byCat.get(key) ?? [];
      arr.push(d);
      byCat.set(key, arr);
    }
    const result: { id: string; category: CategoryDTO | null; dishes: DishDTO[] }[] =
      categories.map((c) => ({
        id: c.id,
        category: c,
        dishes: byCat.get(c.id) ?? [],
      }));
    const uncategorized = byCat.get(UNCATEGORIZED) ?? [];
    if (uncategorized.length > 0) {
      result.push({ id: UNCATEGORIZED, category: null, dishes: uncategorized });
    }
    return result;
  }, [categories, dishes]);

  const menuUrl = slug ? `https://${slug}.${ROOT_DOMAIN}` : null;

  // --- Kategori işlemleri ---

  const onCategorySaved = useCallback((category: CategoryDTO) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      return exists
        ? prev.map((c) => (c.id === category.id ? category : c))
        : [...prev, category];
    });
  }, []);

  async function deleteCategory(category: CategoryDTO) {
    if (
      !confirm(
        `"${category.name}" kategorisini silmek istediğinize emin misiniz? İçindeki yemekler kategorisiz kalır.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Kategori silinemedi");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      // Silinen kategorideki yemekler kategorisiz olur.
      setDishes((prev) =>
        prev.map((d) =>
          d.categoryId === category.id ? { ...d, categoryId: null } : d,
        ),
      );
      toast.success("Kategori silindi");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    }
  }

  // --- Yemek işlemleri ---

  const onDishSaved = useCallback((dish: DishDTO) => {
    setDishes((prev) => {
      const exists = prev.some((d) => d.id === dish.id);
      return exists
        ? prev.map((d) => (d.id === dish.id ? dish : d))
        : [...prev, dish];
    });
  }, []);

  async function deleteDish(dish: DishDTO) {
    if (!confirm(`"${dish.name}" yemeğini silmek istediğinize emin misiniz?`))
      return;
    try {
      const res = await fetch(`/api/dishes/${dish.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Yemek silinemedi");
        return;
      }
      stopPoll(dish.id);
      setDishes((prev) => prev.filter((d) => d.id !== dish.id));
      toast.success("Yemek silindi");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    }
  }

  function setDishStatus(dishId: string, status: ModelStatus) {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, modelStatus: status } : d)),
    );
  }

  function markBusy(dishId: string, busy: boolean) {
    setBusyModels((prev) => {
      const next = new Set(prev);
      if (busy) next.add(dishId);
      else next.delete(dishId);
      return next;
    });
  }

  // --- Sürükle-bırak: aynı grup içinde yeniden sırala ---

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeDish = dishes.find((d) => d.id === activeId);
    const overDish = dishes.find((d) => d.id === overId);
    if (!activeDish || !overDish) return;
    // Sadece aynı grup içinde sıralama.
    if (activeDish.categoryId !== overDish.categoryId) return;

    const groupKey = activeDish.categoryId ?? UNCATEGORIZED;
    const groupDishes = dishes.filter(
      (d) => (d.categoryId ?? UNCATEGORIZED) === groupKey,
    );
    const oldIndex = groupDishes.findIndex((d) => d.id === activeId);
    const newIndex = groupDishes.findIndex((d) => d.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...groupDishes];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const orderedIds = reordered.map((d) => d.id);

    // Optimistik güncelleme: grubu yeni sırayla yerine koy.
    const prevDishes = dishes;
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    setDishes((prev) =>
      [...prev].sort((a, b) => {
        const aKey = a.categoryId ?? UNCATEGORIZED;
        const bKey = b.categoryId ?? UNCATEGORIZED;
        if (aKey !== groupKey || bKey !== groupKey) return 0;
        return (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0);
      }),
    );

    try {
      const res = await fetch("/api/dishes/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: orderedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setDishes(prevDishes);
        toast.error(data.error ?? "Sıralama kaydedilemedi");
      }
    } catch {
      setDishes(prevDishes);
      toast.error("Sıralama kaydedilemedi");
    }
  }

  // --- 3D model: oluştur + poll ---

  async function addModel(dish: DishDTO) {
    markBusy(dish.id, true);
    try {
      const res = await fetch(`/api/dishes/${dish.id}/model`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const msg =
          res.status === 403
            ? (data.error ?? "3D model kotanız doldu")
            : res.status === 409
              ? (data.error ?? "AR Code entegrasyonu yok")
              : (data.error ?? "3D model başlatılamadı");
        toast.error(msg);
        return;
      }
      setDishStatus(dish.id, data.status as ModelStatus);
      // Kota sunucuda model ready'e geçince düşülür; sayacı orada (poll ready)
      // düşürüyoruz ki ready'den önce sayfa yenilenince sapma olmasın.
      toast.success("3D model oluşturma başlatıldı");
      pollModel(dish.id);
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      markBusy(dish.id, false);
    }
  }

  // ~3sn aralıkla durum çek; ready/failed olunca dur. Zamanlayıcılar pollTimers'da
  // izlenir → silme/kaldırma ve unmount'ta iptal edilebilir (leak/yarış önlenir).
  function pollModel(dishId: string) {
    const tick = async () => {
      try {
        const res = await fetch(`/api/dishes/${dishId}/model`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          stopPoll(dishId);
          return;
        }
        const status = data.status as ModelStatus;
        setDishStatus(dishId, status);
        if (status === "ready") {
          // Kota gerçekte sunucuda ready'de tüketilir → sayacı burada düş (tek sefer).
          setRemainingQuota((q) => Math.max(0, q - 1));
          stopPoll(dishId);
          toast.success("3D model hazır!");
          return;
        }
        if (status === "failed") {
          stopPoll(dishId);
          toast.error("3D model oluşturulamadı");
          return;
        }
        // pending | processing → tekrar dene
        pollTimers.current.set(
          dishId,
          window.setTimeout(tick, POLL_INTERVAL_MS),
        );
      } catch {
        stopPoll(dishId);
      }
    };
    stopPoll(dishId); // varsa önceki zinciri iptal et
    pollTimers.current.set(dishId, window.setTimeout(tick, POLL_INTERVAL_MS));
  }

  async function removeModel(dish: DishDTO) {
    if (!confirm(`"${dish.name}" için 3D modeli kaldırmak istiyor musunuz?`))
      return;
    markBusy(dish.id, true);
    try {
      const res = await fetch(`/api/dishes/${dish.id}/model`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "3D model kaldırılamadı");
        return;
      }
      stopPoll(dish.id);
      setDishStatus(dish.id, "none");
      toast.success("3D model kaldırıldı");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      markBusy(dish.id, false);
    }
  }

  // --- Yayınla / Taslak ---

  async function togglePublish(next: boolean) {
    if (publishing) return;
    setPublishing(true);
    const prev = published;
    setPublished(next);
    try {
      const res = await fetch("/api/menu/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPublished(prev);
        toast.error(data.error ?? "Durum değiştirilemedi");
        return;
      }
      setPublished(data.isPublished);
      toast.success(data.isPublished ? "Menü yayında" : "Menü taslağa alındı");
    } catch {
      setPublished(prev);
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setPublishing(false);
    }
  }

  const totalDishes = dishes.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Başlık + yayın kontrolü */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Menü</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalDishes} yemek · {categories.length} kategori
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <Switch
            id="publish"
            checked={published}
            disabled={publishing}
            onCheckedChange={togglePublish}
          />
          <label htmlFor="publish" className="text-sm font-medium">
            {published ? "Yayında" : "Taslak"}
          </label>
        </div>
      </div>

      {/* Menü URL + kota */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {menuUrl ? (
          <a
            href={menuUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLinkIcon className="size-3.5" />
            {slug}.{ROOT_DOMAIN}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            Menü adresi henüz ayarlanmadı.
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {aiEnhanceEnabled ? (
            <>
              Kalan AI canlandırma: <strong>{aiEnhanceQuota}</strong>
            </>
          ) : null}
          {arcodeEnabled ? (
            <>
              {aiEnhanceEnabled ? " · " : ""}3D model: <strong>{remainingQuota}</strong>
            </>
          ) : null}
        </span>
      </div>

      {/* Aksiyonlar */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() =>
            setDishDialog({ open: true, dish: null, defaultCategoryId: null })
          }
        >
          <PlusIcon />
          Yemek Ekle
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCatDialog({ open: true, category: null })}
        >
          <FolderPlusIcon />
          Kategori Ekle
        </Button>
      </div>

      {/* Boş durum */}
      {totalDishes === 0 && categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <UtensilsCrossedIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Menünüz boş</p>
            <p className="text-sm text-muted-foreground">
              İlk kategorinizi ve yemeğinizi ekleyerek başlayın.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setDishDialog({ open: true, dish: null, defaultCategoryId: null })
            }
          >
            <PlusIcon />
            İlk Yemeği Ekle
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-1.5 font-medium">
                    {group.category?.icon && (
                      <span>{group.category.icon}</span>
                    )}
                    <span>{group.category?.name ?? "Kategorisiz"}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({group.dishes.length})
                    </span>
                  </h2>
                  {group.category && (
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/panel/menu/kategori/${group.category.id}/tema`}
                        className={buttonVariants({
                          variant: group.category.hasTheme ? "secondary" : "ghost",
                          size: "sm",
                        })}
                        title="Bu kategoriye özel tema"
                      >
                        <PaletteIcon />
                        Tema
                        {group.category.hasTheme ? (
                          <span className="ml-0.5 size-1.5 rounded-full bg-primary" />
                        ) : null}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Kategoriyi düzenle"
                        onClick={() =>
                          setCatDialog({
                            open: true,
                            category: group.category,
                          })
                        }
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Kategoriyi sil"
                        onClick={() => deleteCategory(group.category!)}
                      >
                        <Trash2Icon className="text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDishDialog({
                            open: true,
                            dish: null,
                            defaultCategoryId: group.category!.id,
                          })
                        }
                      >
                        <PlusIcon />
                        Yemek
                      </Button>
                    </div>
                  )}
                </div>

                {group.dishes.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    Bu kategoride henüz yemek yok.
                  </p>
                ) : (
                  <SortableContext
                    items={group.dishes.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {group.dishes.map((dish) => (
                        <DishCard
                          key={dish.id}
                          dish={dish}
                          arcodeEnabled={arcodeEnabled}
                          quotaAvailable={remainingQuota > 0}
                          modelBusy={busyModels.has(dish.id)}
                          onEdit={(d) =>
                            setDishDialog({
                              open: true,
                              dish: d,
                              defaultCategoryId: null,
                            })
                          }
                          onDelete={deleteDish}
                          onAddModel={addModel}
                          onRemoveModel={removeModel}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </section>
            ))}
          </div>
        </DndContext>
      )}

      <CategoryDialog
        open={catDialog.open}
        category={catDialog.category}
        onOpenChange={(open) =>
          setCatDialog((s) => ({ ...s, open }))
        }
        onSaved={onCategorySaved}
      />

      <DishDialog
        open={dishDialog.open}
        dish={dishDialog.dish}
        categories={categories}
        defaultCategoryId={dishDialog.defaultCategoryId}
        aiEnhanceEnabled={aiEnhanceEnabled}
        onOpenChange={(open) => setDishDialog((s) => ({ ...s, open }))}
        onSaved={onDishSaved}
      />
    </div>
  );
}
