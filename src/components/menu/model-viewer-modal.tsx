"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 3D/AR görüntüleyici modalı.
// @google/model-viewer SADECE modal açıldığında tembel yüklenir; böylece
// menünün ilk açılışı hızlı kalır. <model-viewer> bir web component'tir,
// import edildikten sonra custom element olarak kayıt olur.

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  glbUrl: string;
  usdzUrl?: string | null;
  posterUrl?: string | null;
};

export function ModelViewerModal({
  open,
  onOpenChange,
  name,
  glbUrl,
  usdzUrl,
  posterUrl,
}: Props) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || ready) return;
    let active = true;
    import("@google/model-viewer")
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [open, ready]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,540px)] gap-3 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base">{name}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full overflow-hidden rounded-lg bg-muted">
          {failed ? (
            <div className="flex aspect-square w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              3D model yüklenemedi. Lütfen tekrar deneyin.
            </div>
          ) : !ready ? (
            <div className="flex aspect-square w-full items-center justify-center text-sm text-muted-foreground">
              3D model yükleniyor…
            </div>
          ) : (
            <model-viewer
              src={glbUrl}
              ios-src={usdzUrl ?? undefined}
              poster={posterUrl ?? undefined}
              alt={`${name} 3D modeli`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              touch-action="pan-y"
              shadow-intensity="1"
              exposure="1"
              reveal="auto"
              style={{
                width: "100%",
                height: "min(70vh, 480px)",
                aspectRatio: "1 / 1",
                backgroundColor: "transparent",
              }}
            >
              {/* AR butonu: model-viewer içine slot'lanır, cihaz uygunsa görünür. */}
              <button
                slot="ar-button"
                type="button"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg"
              >
                AR&apos;da Gör
              </button>
            </model-viewer>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Parmaklarınızla döndürün · Uyumlu cihazlarda AR&apos;da görüntüleyin
        </p>
      </DialogContent>
    </Dialog>
  );
}
