import Link from "next/link";
import { QrCard } from "@/components/panel/qr/qr-card";
import { buttonVariants } from "@/components/ui/button";
import { requireRestaurant, requireUser } from "@/lib/auth/session";
import { publicMenuUrl, qrPngDataUrl, qrSvgString } from "@/lib/qr";

export default async function PanelQrPage() {
  const user = await requireUser();
  const restaurant = await requireRestaurant(user.id);

  // Slug yoksa QR üretemeyiz — kurulumu tamamlamaya yönlendir.
  if (!restaurant.slug) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">QR Kod</h1>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            QR kodunuzu oluşturabilmek için önce menü adresinizi (slug)
            belirlemeniz gerekiyor.
          </p>
          <Link
            href="/onboarding"
            className={buttonVariants({ size: "sm", className: "mt-4" })}
          >
            Kurulumu Tamamla
          </Link>
        </div>
      </div>
    );
  }

  const url = publicMenuUrl(restaurant.slug);
  const [png, svg] = await Promise.all([qrPngDataUrl(url), qrSvgString(url)]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">QR Kod</h1>
        <p className="mt-1 text-muted-foreground">
          Menünüzün QR kodunu indirin ve paylaşın.
        </p>
      </div>

      <QrCard url={url} png={png} svg={svg} slug={restaurant.slug} />
    </div>
  );
}
