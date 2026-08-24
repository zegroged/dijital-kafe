import { apiHandler, HttpError, requireOwnerContext } from "@/lib/auth/guard";
import { ok } from "@/lib/http";
import { publicMenuUrl, qrPngDataUrl, qrSvgString } from "@/lib/qr";

// GET /api/qr -> giriş yapan sahibin menüsünün QR'ı (url + png dataURL + svg string).
export const GET = apiHandler(async () => {
  const { restaurant } = await requireOwnerContext();
  if (!restaurant.slug) {
    throw new HttpError(409, "Menü adresi (slug) henüz ayarlanmamış");
  }

  const url = publicMenuUrl(restaurant.slug);
  const [png, svg] = await Promise.all([qrPngDataUrl(url), qrSvgString(url)]);

  return ok({ ok: true, url, png, svg });
});
