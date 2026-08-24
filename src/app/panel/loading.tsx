import { Skeleton } from "@/components/ui/skeleton";

// Panel sayfaları arası geçişte (auth + DB beklenirken) donmuş eski sayfa
// yerine anlık iskelet → gezinme "tepkisel" hissettirir.
export default function PanelLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
