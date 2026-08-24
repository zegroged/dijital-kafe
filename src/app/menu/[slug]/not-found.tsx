import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, ROOT_DOMAIN } from "@/lib/constants";

// Slug'a karşılık restoran/menü yoksa gösterilir.
export default function MenuNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="text-5xl">🍽️</div>
      <h1 className="text-2xl font-semibold">Menü bulunamadı</h1>
      <p className="max-w-sm text-balance text-muted-foreground">
        Aradığınız menü mevcut değil ya da kaldırılmış olabilir. Lütfen adresi
        kontrol edin.
      </p>
      <Link
        href={`https://${ROOT_DOMAIN}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {APP_NAME} ile kendi menünü oluştur
      </Link>
    </div>
  );
}
