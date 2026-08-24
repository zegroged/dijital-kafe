"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/panel", label: "Panel" },
  { href: "/panel/menu", label: "Menü" },
  { href: "/panel/adisyon", label: "Adisyon" },
  { href: "/panel/masalar", label: "Masalar" },
  { href: "/panel/calisanlar", label: "Çalışanlar" },
  { href: "/panel/tema", label: "Tema" },
  { href: "/panel/qr", label: "QR Kod" },
  { href: "/panel/magaza", label: "Fiziksel QR" },
  { href: "/panel/abonelik", label: "Abonelik" },
];

export function PanelNav() {
  const pathname = usePathname();
  // Mobilde 9 link tek satıra sığmıyordu → sayfa yatay taşıyor ve kullanıcı
  // okuyamayacak kadar uzaklaştırmak zorunda kalıyordu. Telefonda satırlara
  // sarar (hepsi görünür), md üstünde eskisi gibi dikey sütun.
  return (
    <nav className="flex flex-wrap gap-1 md:flex-col md:flex-nowrap">
      {items.map((it) => {
        const active =
          pathname === it.href ||
          (it.href !== "/panel" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
