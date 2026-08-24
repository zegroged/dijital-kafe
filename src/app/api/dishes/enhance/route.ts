import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getImageEnhanceProvider } from "@/lib/services/nanobanana";
import { MockImageEnhanceProvider } from "@/lib/services/nanobanana/mock";
import { processAndStoreImage, readStoredImage } from "@/lib/storage";
import {
  ENHANCE_PERIOD_MS,
  enhanceState,
} from "@/lib/subscription/access";
import { z } from "zod";

export const runtime = "nodejs";

// AI canlandırma uzun sürebilir (Gemini görsel çağrısı). Cevap için pay bırak.
export const maxDuration = 60;

const bodySchema = z.object({
  // Daha önce /api/upload ile yüklenmiş görselin URL'i (yerel /uploads veya Bunny).
  imageUrl: z.string().min(1),
});

// POST /api/dishes/enhance { imageUrl } → { ok, imageUrl, thumbnailUrl }
// Yüklenen yemek fotoğrafını SABİT prompt ile canlandırır (içeriği değiştirmeden
// renk/ışık) ve YENİ bir görsel olarak depolar. Sahip yeni URL'i onaylayınca
// dish.imageUrl güncellenir (DishDialog yapar); orijinal originalImageUrl'de saklanır.
//
// Dayanıklılık: yapılandırılmış sağlayıcı (Gemini) başarısız olursa (ör. proje
// faturalandırması açık değilse 429) sharp tabanlı yerel canlandırmaya düşülür →
// özellik HER ZAMAN görünür bir sonuç verir; billing açılınca otomatik gerçek AI.
export const POST = apiHandler(async (req: Request) => {
  const { userId, subscription } = await requireOwnerContext();

  const provider = getImageEnhanceProvider();
  if (!provider.isConfigured()) {
    return fail("AI görsel canlandırma henüz aktif değil", 409);
  }

  // Maliyetli (AI çağrısı + 2x sharp). Sahip başına teknik sınır.
  const rl = await rateLimit(`enhance:${userId}`, 30, 600); // 10 dk'da 30
  if (!rl.ok) {
    return fail("Çok fazla istek. Lütfen biraz sonra tekrar deneyin.", 429);
  }

  // Paket kotası (paketlerin ana farkı). Yuvarlanan 30 günlük döngü.
  const now = new Date();
  const state = enhanceState(subscription, now);
  if (!state.canEnhance) {
    return fail(
      "Bu ayki AI canlandırma hakkınız doldu. Planınızı yükseltebilirsiniz.",
      403,
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  let bytes: Buffer;
  try {
    bytes = await readStoredImage(parsed.data.imageUrl);
  } catch {
    return fail("Görsel okunamadı", 400);
  }

  // Gemini (live) dene; başarısızsa sharp yedeğine düş → her zaman sonuç döner.
  let enhancedBytes: Buffer;
  try {
    const r = await provider.enhance({ bytes, mimeType: "image/webp" });
    enhancedBytes = r.bytes;
  } catch (e) {
    console.warn("[enhance] sağlayıcı başarısız, sharp yedeğine düşülüyor:", e);
    try {
      const r = await new MockImageEnhanceProvider().enhance({
        bytes,
        mimeType: "image/webp",
      });
      enhancedBytes = r.bytes;
    } catch (e2) {
      console.error("[enhance] yedek de başarısız:", e2);
      return fail("Görsel canlandırılamadı, tekrar deneyin.", 502);
    }
  }

  // Canlandırılmış baytları normal pipeline'dan geçir (1200px + 400px thumb webp).
  const stored = await processAndStoreImage(enhancedBytes, "dishes");

  // Kotayı tüket (yuvarlanan döngü). Sahip başına tek akış → basit + güvenli.
  if (subscription) {
    if (state.periodExpired) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          aiEnhancementsUsed: 1,
          aiEnhanceResetAt: new Date(now.getTime() + ENHANCE_PERIOD_MS),
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { aiEnhancementsUsed: { increment: 1 } },
      });
    }
  }

  return ok({ ok: true, ...stored, remaining: Math.max(0, state.remaining - 1) });
});
