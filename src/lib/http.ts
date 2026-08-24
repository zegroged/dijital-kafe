import { NextResponse } from "next/server";

// API route'ları için tutarlı JSON yanıtları.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

// İstemci IP'si (Cloudflare → nginx zinciri). İyzico ödeme isteği için gerekir.
export function getClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "85.34.78.112"; // son çare (İyzico geçerli IP bekler)
}
