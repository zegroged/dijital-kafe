import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { type ImageFolder, processAndStoreImage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic", // iPhone fotoğrafları
  "image/heif",
]);
const FOLDERS: ImageFolder[] = [
  "dishes",
  "categories",
  "logos",
  "covers",
  "backgrounds",
  "products",
];

// POST /api/upload  (multipart: file, folder?) → { ok, imageUrl, thumbnailUrl }
export const POST = apiHandler(async (req: Request) => {
  const { userId } = await requireOwnerContext();

  // Ağır işlem (2x sharp re-encode + CDN). Sahip başına sınırla.
  const rl = await rateLimit(`upload:${userId}`, 20, 600); // 10 dk'da 20 yükleme
  if (!rl.ok) {
    return fail("Çok fazla yükleme. Lütfen biraz sonra tekrar deneyin.", 429);
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Dosya gerekli");
  if (!ALLOWED.has(file.type)) return fail("Sadece JPEG, PNG veya WebP");
  if (file.size > MAX_BYTES) return fail("Dosya en fazla 10MB olabilir");

  const folderRaw = form.get("folder");
  const folder: ImageFolder = FOLDERS.includes(folderRaw as ImageFolder)
    ? (folderRaw as ImageFolder)
    : "dishes";

  const buf = Buffer.from(await file.arrayBuffer());
  const result = await processAndStoreImage(buf, folder);
  return ok({ ok: true, ...result });
});
