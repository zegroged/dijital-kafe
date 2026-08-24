"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  GripVerticalIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  Sparkles,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModelStatusBadge } from "./model-status-badge";
import type { DishDTO } from "./types";

const TRY = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

interface Props {
  dish: DishDTO;
  arcodeEnabled: boolean;
  quotaAvailable: boolean;
  modelBusy: boolean;
  onEdit: (dish: DishDTO) => void;
  onDelete: (dish: DishDTO) => void;
  onAddModel: (dish: DishDTO) => void;
  onRemoveModel: (dish: DishDTO) => void;
}

export function DishCard({
  dish,
  arcodeEnabled,
  quotaAvailable,
  modelBusy,
  onEdit,
  onDelete,
  onAddModel,
  onRemoveModel,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dish.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const status = dish.modelStatus;
  const isReady = status === "ready";
  const isPending = status === "pending" || status === "processing";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button
        type="button"
        className="touch-none text-muted-foreground hover:text-foreground"
        aria-label="Sürükle"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <SmartImage
          src={dish.thumbnailUrl ?? dish.imageUrl}
          alt={dish.name}
          className="size-full object-cover"
          fallbackClassName="bg-muted"
          fallback={<ImageIcon className="size-5" />}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-medium">{dish.name}</span>
          {!dish.isAvailable && (
            <Badge variant="outline" className="text-muted-foreground">
              Gizli
            </Badge>
          )}
          <ModelStatusBadge status={status} />
        </div>
        {dish.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {dish.description}
          </p>
        )}
        <p className="mt-0.5 text-sm font-semibold">{TRY.format(dish.price)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {/* 3D işlemleri */}
        {isReady ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={modelBusy}
                  onClick={() => onRemoveModel(dish)}
                />
              }
            >
              {modelBusy ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <Box className="text-primary" />
              )}
              <span className="sr-only">3D modeli kaldır</span>
            </TooltipTrigger>
            <TooltipContent>3D modeli kaldır</TooltipContent>
          </Tooltip>
        ) : (
          <ModelAddButton
            arcodeEnabled={arcodeEnabled}
            quotaAvailable={quotaAvailable}
            busy={modelBusy || isPending}
            isPending={isPending}
            onClick={() => onAddModel(dish)}
          />
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(dish)}
              />
            }
          >
            <PencilIcon />
            <span className="sr-only">Düzenle</span>
          </TooltipTrigger>
          <TooltipContent>Düzenle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(dish)}
              />
            }
          >
            <Trash2Icon className="text-destructive" />
            <span className="sr-only">Sil</span>
          </TooltipTrigger>
          <TooltipContent>Sil</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ModelAddButton({
  arcodeEnabled,
  quotaAvailable,
  busy,
  isPending,
  onClick,
}: {
  arcodeEnabled: boolean;
  quotaAvailable: boolean;
  busy: boolean;
  isPending: boolean;
  onClick: () => void;
}) {
  const disabled = !arcodeEnabled || !quotaAvailable || busy;

  let tip = "3D Ekle";
  if (!arcodeEnabled) tip = "AR Code yakında";
  else if (!quotaAvailable) tip = "3D model kotanız doldu";
  else if (isPending) tip = "3D model hazırlanıyor…";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {busy ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <Sparkles className="text-muted-foreground" />
        )}
        <span className="sr-only">{tip}</span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
