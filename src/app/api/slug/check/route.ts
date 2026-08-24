import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeSlug, validateSlug } from "@/lib/validations/slug";

export const runtime = "nodejs";

// GET /api/slug/check?slug=kahve-dunyasi
// Kayıt formunda anlık müsaitlik kontrolü (debounce'lu çağrılır).
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit(`slug:${ip}`, 30, 60); // 1 dk'da 30 kontrol
  if (!rl.ok) {
    return NextResponse.json(
      { slug: "", available: false, error: "Çok fazla istek. Biraz sonra deneyin." },
      { status: 429 },
    );
  }

  const raw = req.nextUrl.searchParams.get("slug") ?? "";
  const slug = normalizeSlug(raw);

  const check = validateSlug(slug);
  if (!check.valid) {
    return NextResponse.json({ slug, available: false, error: check.error });
  }

  const existing = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true },
  });

  return NextResponse.json({
    slug,
    available: !existing,
    error: existing ? "Bu adres alınmış" : undefined,
  });
}
