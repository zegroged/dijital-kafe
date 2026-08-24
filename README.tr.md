# KAFE — QR Menü + 3D/AR SaaS

Restoran ve kafeler için: kolay menü oluşturma, otomatik subdomain (`kahvecim.to-p1.com`),
tema özelleştirme, QR kod ve web tabanlı 3D/AR yemek görüntüleme.

## Teknoloji

- **Next.js 15** (App Router) + **Tailwind v4** + **shadcn/ui** (Base UI)
- **PostgreSQL 16** + **Prisma 7** (driver adapter `@prisma/adapter-pg`)
- **Redis 7** (ioredis) — token, rate limit, menü cache
- **Auth.js v5** (Credentials + JWT)
- **BunnyCDN** (depolama), **Resend** (e-posta), **AR Code** (3D/AR) — _opsiyonel, sonradan_

## Yerel Geliştirme

```bash
# 1) Altyapı (Postgres + Redis)
docker compose up -d

# 2) Ortam değişkenleri
cp .env.example .env        # AUTH_SECRET üret: npx auth secret

# 3) Bağımlılıklar + DB şeması
npm install
npx prisma migrate dev

# 4) Çalıştır
npm run dev                 # http://localhost:3000
```

Subdomain testi (local): `http://kahvecim.localhost:3000`.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run db:migrate` | Migration oluştur/uygula |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

## Yapı

```
src/
├─ app/                     # sayfalar + API route'ları
│  ├─ api/auth/[...nextauth] # Auth.js handler (Node runtime)
│  └─ menu/[slug]/          # (gelecek) public menü sayfası
├─ auth.ts                  # Auth.js yapılandırması
├─ middleware.ts            # subdomain → /menu/[slug] (DB sorgusu YOK)
├─ components/ui/           # shadcn bileşenleri
├─ generated/prisma/        # Prisma client (git'te yok)
└─ lib/
   ├─ prisma.ts  redis.ts  env.ts  constants.ts
   ├─ auth/                 # password, session helper'ları
   ├─ theme/schema.ts       # theme_settings JSON şeması + paletler
   ├─ validations/          # slug, auth (zod)
   └─ services/arcode/      # AR Code seam (aşağıya bakın)
```

## AR Code'u canlıya alma (≈ "2 dakikalık iş")

3D/AR entegrasyonu tamamen soyutlandı. AR Code STANDARD planı alınınca:

1. `.env`:
   ```
   ARCODE_PROVIDER=live
   ARCODE_API_KEY=...
   ARCODE_API_BASE=...
   ARCODE_WEBHOOK_SECRET=...
   ```
2. `src/lib/services/arcode/live.ts` içindeki 3 `TODO(arcode)` bloğunu API dokümanına göre doldur
   (createScan / getScan endpoint'leri + durum eşlemesi).

Geri kalan her şey (DB alanları `model_3d_url`/`model_usdz_url`/`model_status`, kota, UI, modal) hazır.
Test için: `ARCODE_PROVIDER=mock` → örnek `.glb`+`.usdz` modellerle arayüzü çalıştırır.

## Açık operasyon konuları (deploy öncesi)

- **Wildcard SSL** (`*.to-p1.com`): DNS Natro'da; DNS-01 için en pratik yol DNS'i **Cloudflare**'a taşıyıp
  `certbot-dns-cloudflare` kullanmak. SSL kurulana kadar `nginx/nginx.conf` HTTP üzerinden çalışır.
- **Sunucu deploy**: `docker compose -f docker-compose.prod.yml up -d --build` (web + db + redis + nginx).

## Durum

Aşama 1 altyapısı kuruldu (proje, DB şeması, auth, middleware, AR Code seam, Docker).
Sıradaki: kayıt + onboarding wizard + landing.
