import { apiHandler, requireAffiliateContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { processAndStoreImage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// POST /api/affiliate/tax-doc (multipart: file) → { ok, imageUrl, thumbnailUrl }
// Komisyoncu vergi levhasının FOTOĞRAFINI yükler (görsel pipeline → tax-docs).
export const POST = apiHandler(async (req: Request) => {
  const { userId } = await requireAffiliateContext();

  const rl = await rateLimit(`taxdoc:${userId}`, 10, 600);
  if (!rl.ok) return fail("Çok fazla yükleme. Biraz sonra tekrar deneyin.", 429);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Dosya gerekli");
  if (!ALLOWED.has(file.type)) {
    return fail("Sadece JPEG, PNG veya WebP (belgenin fotoğrafı)");
  }
  if (file.size > MAX_BYTES) return fail("Dosya en fazla 10MB olabilir");

  const buf = Buffer.from(await file.arrayBuffer());
  const result = await processAndStoreImage(buf, "tax-docs");
  return ok({ ok: true, ...result });
});
