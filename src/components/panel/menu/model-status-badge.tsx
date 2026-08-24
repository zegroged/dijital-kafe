import { Badge } from "@/components/ui/badge";
import type { ModelStatus } from "@/generated/prisma/client";

const LABELS: Record<
  Exclude<ModelStatus, "none">,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "3D Sırada", variant: "secondary" },
  processing: { label: "3D İşleniyor", variant: "secondary" },
  ready: { label: "3D Hazır", variant: "default" },
  failed: { label: "3D Başarısız", variant: "destructive" },
};

// Yemek kartındaki 3D model durumu rozeti. status="none" iken hiçbir şey göstermez.
export function ModelStatusBadge({ status }: { status: ModelStatus }) {
  if (status === "none") return null;
  const cfg = LABELS[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
