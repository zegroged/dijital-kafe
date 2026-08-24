"use client";

import { ImageIcon } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// Menü görselleri için sağlam <img> sarmalayıcısı.
// next/image KULLANILMAZ (yemek görselleri yerel /uploads veya Bunny olabilir;
// remotePatterns dışına çıkabilir) — bunun yerine ham <img>'in eksiklerini kapatır:
//   • Yüklenince yumuşak fade-in (pop-in/zıplama hissi yok)
//   • onError → kırık görsel yerine zarif yedek (placeholder)
//   • decoding="async" + doğru loading/fetchPriority (kapak = eager + high)
//   • SSR/cache güvenli: hydrate anında zaten yüklüyse görünür kalır
//     (aksi halde onLoad bir daha tetiklenmez ve görsel görünmez kalırdı).

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: CSSProperties;
  // Ekranın üstündeki kritik görsel (kapak/logo) → eager + yüksek öncelik.
  priority?: boolean;
  // Hata/eksik durumunda gösterilecek içerik (varsayılan: nötr ikon).
  fallback?: ReactNode;
  // Yedek kutusunun arka plan stili (tema yüzeylerinde uyum için).
  fallbackClassName?: string;
};

export function SmartImage({
  src,
  alt,
  className,
  style,
  priority = false,
  fallback,
  fallbackClassName,
}: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Kaynak değişirse durumu sıfırla (örn. "Görseli değiştir").
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  // Hydrate anında görsel zaten tamamlanmışsa onLoad tetiklenmez → elle yakala.
  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth === 0) setErrored(true);
      else setLoaded(true);
    }
  }, [src]);

  if (!src || errored) {
    return (
      <div
        aria-hidden
        style={style}
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          fallbackClassName ?? "bg-muted",
          className,
        )}
      >
        {fallback ?? <ImageIcon className="size-1/4 max-h-10 max-w-10 opacity-40" />}
      </div>
    );
  }

  return (
    // next/image yerine kasıtlı ham <img>: yerel /uploads veya Bunny görselleri
    // remotePatterns dışına çıkabilir; bu bileşen hata/fade/öncelik işini üstlenir.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      style={style}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
      className={cn(
        "transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
