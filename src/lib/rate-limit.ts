import { redis } from "@/lib/redis";

// Basit sabit-pencere rate limit (Redis INCR + EXPIRE).
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number }> {
  const k = `rl:${key}`;
  const count = await redis.incr(k);
  if (count === 1) {
    await redis.expire(k, windowSec);
  }
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

// Güvenilir istemci IP'si.
// Nginx X-Real-IP'yi gerçek $remote_addr'e set eder → öncelikle onu kullan.
// X-Forwarded-For'un SOL ucu istemci tarafından sahteleştirilebilir; Nginx
// $proxy_add_x_forwarded_for ile gerçek IP'yi SAĞ uca ekler, o yüzden XFF
// fallback'inde sağ-en uçtaki değeri al.
export function clientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "local";
}
