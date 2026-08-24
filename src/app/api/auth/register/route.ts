import { type NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/register";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/auth/register  { email, password, businessName, name?, slug? }
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit(`register:${ip}`, 5, 600); // 10 dk'da 5 deneme
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Geçersiz istek" },
      { status: 400 },
    );
  }

  const result = await registerUser(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
