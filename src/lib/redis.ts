import Redis from "ioredis";

// Redis kullanım alanları:
//  - E-posta doğrulama / şifre sıfırlama token'ları (TTL'li)
//  - Rate limiting (login, kayıt, slug kontrolü)
//  - Yayınlanmış menülerin cache'i (QR trafiği için)
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
