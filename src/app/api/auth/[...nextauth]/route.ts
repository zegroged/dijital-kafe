import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Credentials + Prisma + bcrypt kullandığımız için Node runtime şart.
export const runtime = "nodejs";

export const GET = handlers.GET;

// Sadece credentials giriş callback'ini rate-limit'le (brute-force / credential
// stuffing'e karşı). Diğer NextAuth POST'ları (csrf, signout) etkilenmez.
export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.endsWith("/callback/credentials")) {
    const ip = clientIp(req.headers);
    const rl = await rateLimit(`login:${ip}`, 10, 600); // 10 dk'da 10 deneme
    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Çok fazla giriş denemesi. Lütfen biraz sonra tekrar deneyin.",
        },
        { status: 429 },
      );
    }
  }
  return handlers.POST(req);
}
