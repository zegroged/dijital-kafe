# KAFE web (Next.js 15, standalone).
# Prisma 7 driver adapter (pg) + sharp uyumu için Debian slim (glibc).

# ---- bağımlılıklar ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma 7 client'ı üret (src/generated/prisma)
RUN npx prisma generate
# env.ts derleme sırasında doğrulandığı için zorunlu (gizli) alanlara dummy değer
# ver. Gerçek gizli değerler runtime'da env_file ile gelir.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV REDIS_URL="redis://localhost:6379"
ENV AUTH_SECRET="build_time_placeholder_secret_change_me"
# NEXT_PUBLIC_* build anında client paketlerine GÖMÜLÜR → domaini build arg ile
# geçir ki domain değişiminde client tarafı da doğru olsun. compose, .env'deki
# ${NEXT_PUBLIC_ROOT_DOMAIN}'i bu arg'a aktarır (yoksa varsayılan to-p1.com).
ARG NEXT_PUBLIC_ROOT_DOMAIN=to-p1.com
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
RUN npm run build

# ---- migrator (prisma migrate deploy) ----
FROM node:22-bookworm-slim AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts package.json ./
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# standalone çıktı: gerekli node_modules izlenerek kopyalanır
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Yerel görsel yüklemeleri için (Bunny yokken) yazılabilir dizin + volume sahipliği
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
