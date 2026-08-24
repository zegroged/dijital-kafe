import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env, integrations } from "@/lib/env";

// Görsel işleme + depolama. Bunny yapılandırılmışsa CDN'e, değilse yerel
// public/uploads'a (geliştirme) yazar. Çağıran taraf sadece URL'leri alır.

const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;

export type UploadResult = { imageUrl: string; thumbnailUrl: string };

export type ImageFolder =
  | "dishes"
  | "categories"
  | "logos"
  | "covers"
  | "backgrounds"
  | "products"
  | "tax-docs";

export async function processAndStoreImage(
  input: Buffer,
  folder: ImageFolder = "dishes",
): Promise<UploadResult> {
  const id = randomUUID();
  const [main, thumb] = await Promise.all([
    sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    sharp(input)
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
  ]);

  const mainKey = `${folder}/${id}.webp`;
  const thumbKey = `${folder}/${id}_thumb.webp`;

  if (integrations.bunny()) {
    const [imageUrl, thumbnailUrl] = await Promise.all([
      putToBunny(mainKey, main),
      putToBunny(thumbKey, thumb),
    ]);
    return { imageUrl, thumbnailUrl };
  }

  // Yerel fallback (geliştirme)
  const baseDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(path.join(baseDir, folder), { recursive: true });
  await Promise.all([
    writeFile(path.join(baseDir, mainKey), main),
    writeFile(path.join(baseDir, thumbKey), thumb),
  ]);
  return { imageUrl: `/uploads/${mainKey}`, thumbnailUrl: `/uploads/${thumbKey}` };
}

// Daha önce yüklenmiş bir görselin baytlarını güvenle geri oku (AI canlandırma
// gibi yeniden işleme için). SSRF/path-traversal'a karşı KATI allowlist:
// yalnız yerel /uploads/... veya yapılandırılmış Bunny CDN host'u kabul edilir.
const BUNNY_HOST_RE = /^https:\/\/[a-z0-9-]+\.b-cdn\.net\//i;

export async function readStoredImage(url: string): Promise<Buffer> {
  // Yerel yükleme: /uploads/... → diskten oku.
  if (url.startsWith("/uploads/")) {
    const baseDir = path.join(process.cwd(), "public", "uploads");
    const full = path.join(baseDir, url.slice("/uploads/".length));
    // Traversal koruması: çözülen yol baseDir altında kalmalı.
    const resolvedBase = path.resolve(baseDir);
    if (!path.resolve(full).startsWith(resolvedBase + path.sep)) {
      throw new Error("Geçersiz görsel yolu");
    }
    return readFile(full);
  }

  // Uzak depolama: yalnız Bunny CDN'e izin (SSRF engeli).
  const cdnBase = (env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");
  if (BUNNY_HOST_RE.test(url) || (cdnBase && url.startsWith(`${cdnBase}/`))) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Görsel indirilemedi: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error("Desteklenmeyen görsel kaynağı");
}

async function putToBunny(key: string, body: Buffer): Promise<string> {
  const host = env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";
  const zone = env.BUNNY_STORAGE_ZONE;
  const res = await fetch(`https://${host}/${zone}/${key}`, {
    method: "PUT",
    headers: {
      AccessKey: env.BUNNY_STORAGE_ACCESS_KEY ?? "",
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    throw new Error(`Bunny yükleme hatası: ${res.status}`);
  }
  const cdn = (env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");
  return `${cdn}/${key}`;
}
