# Dijital Kafe

> Multi-tenant QR menu and digital-tab (lightweight POS) SaaS for cafés and restaurants, where every tenant gets its own subdomain.

**Live:** [dijitalkafe.com](https://dijitalkafe.com) · Turkish README: [README.tr.md](README.tr.md)

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000)
![React 19](https://img.shields.io/badge/React-19-149ECA)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748)
![Redis 7](https://img.shields.io/badge/Redis-7-DC382D)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue)

---

## Overview

Small cafés and restaurants in Turkey switched to QR menus during the pandemic and mostly ended up
with a PDF behind a QR code — no way to edit prices, no branding, no analytics. The tools that did
more were priced for chains. Dijital Kafe was built for the other end of the market: an owner signs
up, walks through an onboarding wizard, and within minutes has a themed, mobile-first menu served
from `their-slug.dijitalkafe.com` plus a printable QR code.

The product grew beyond the menu. Because the same tables already model the venue, its staff and its
prices, it also carries a digital tab system (*adisyon*) — waiters open a tab per table, add items,
and close it as cash or card. Around the core product sits the machinery a Turkish SaaS actually
needs to operate: an Iyzico checkout integration, a referral/affiliate program with one-time and
recurring commission models, a withdrawal pipeline with income-tax withholding (*stopaj*) and
expense-voucher (*gider pusulası*) reconciliation for the accountant, and a small storefront where
owners order physical laser-etched QR stands from a third-party manufacturer.

That produced a platform with **seven distinct roles** — restaurant owner, platform admin, QR
manufacturer, affiliate, affiliate manager, accountant, and staff — each with its own portal.
Concretely: **23 Prisma models**, **26 pages**, **63 API routes**, **22 migrations**, **65 React
components**, and roughly **21,000 hand-written lines of TypeScript/TSX**. That line count excludes
the generated Prisma client under `src/generated/`, which is another ~46,000 lines.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, `force-dynamic` public menu) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4, shadcn/ui on Base UI, `next-themes` |
| Database | PostgreSQL 16 + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Cache / limits | Redis 7 (ioredis) — rate limiting, tokens |
| Auth | Auth.js v5 (Credentials + JWT), bcryptjs |
| Validation | Zod 4 — request bodies, env vars, and the theme JSON schema |
| Payments | Iyzico CheckoutForm (authV2 HMAC signing, hand-rolled — no SDK); live path unverified |
| Images | sharp (WebP pipeline), BunnyCDN storage with local-disk fallback |
| 3D / AR | `@google/model-viewer` (GLB + USDZ), lazy-loaded in a modal |
| Email | Nodemailer over SMTP (verification and password-reset mail) |
| Infra | Docker multi-stage build, Docker Compose, nginx reverse proxy behind Cloudflare |

## Features

**Restaurant owner** — onboarding wizard (template → first dish → publish), drag-and-drop menu
builder (`@dnd-kit`) for categories and dishes, per-category theme overrides, QR code download as
PNG or SVG, table management, staff accounts, subscription and billing panel, physical QR storefront.

**Public menu** (no login) — served at `<slug>.dijitalkafe.com` via subdomain rewrite; category
browsing, dish detail, optional 3D/AR viewer, and a "closed" state when the tenant's trial or
subscription has lapsed.

**Staff** — dedicated `/adisyon` board: open a tab per table, add and remove line items, and close
the tab as cash or card. Owners and staff share the same endpoints through one guard that resolves
the restaurant from either role.

**Affiliate** — referral code, live balance split into available / locked / withdrawn, IBAN and tax
details, tax-document upload, withdrawal requests, and self-service cancellation of a pending request.

**Affiliate manager** — a deliberately narrow role that can create affiliate accounts and nothing else.

**Accountant** — sets the platform-wide withholding rate, records expense-voucher number, date and
notes against each paid withdrawal, and exports a CSV of all paid withdrawals for tax filing.

**QR manufacturer** — product catalogue CRUD and an order pipeline
(`pending → paid → processing → shipped → delivered`), with platform fee and vendor payout computed
per order.

**Platform admin** — creates vendor, affiliate, affiliate-manager and accountant accounts; approves,
rejects, pays or recovers withdrawals; cancels referrals to stop recurring commission; exports
withdrawal data.

**Theme engine** — 150 named presets, each inspired by a venue type (coffee bar, fine dining, grill,
pizzeria, and so on) and sorted in the picker into three style groups — *Beyaz* / *Premium* / *Şık*
(white / premium / chic) — plus a customizer for colors, fonts, card radius/shadow/border, button
style, background (solid / gradient / image) and decorative accents.

**AI photo enhancement** — the upload → enhance → compare → approve/revert flow is built end to end,
with the original photo preserved so the owner can revert. The intended backend is Google's Gemini
image model under a fixed prompt, but that provider was never keyed or verified; see
[Known limitations](#known-limitations). Under the shipped default the enhance button is hidden, and
under `NANOBANANA_PROVIDER=mock` the enhancement is a local sharp color pass.

## Architecture / Design notes

These are the decisions worth explaining.

**Subdomain routing with zero database work in middleware.**
`src/middleware.ts` runs on every non-API request. It does pure string work on the `Host` header —
strip the port, compare against the root domain, take the single-label subdomain, rewrite to
`/menu/<slug>`. There is deliberately **no tenant lookup** there: middleware runs on the edge
runtime, where a Prisma round-trip on every request would add latency to every page and couple the
hot path to database availability. Tenant resolution happens one layer down, in the Node-runtime
page, where it can be cached.

**Cache the menu, never the paywall.**
`/menu/[slug]` wraps the expensive join (restaurant → menu → categories → dishes → theme) in
`unstable_cache` tagged `menu:<slug>`. Every mutation that changes menu content calls
`revalidatePublicMenu(slug)`. The subscription/trial gate is evaluated **outside** the cache on every
request, so an expiring trial takes effect immediately instead of at the next cache bust. Getting
this split wrong is how QR menus stay visible after a customer stops paying.

**Provider seams for every external dependency.**
`src/lib/services/` holds four integrations — `arcode` (3D scanning), `nanobanana` (Gemini image
enhancement), `payment` (Iyzico), `payout` (affiliate transfers). Each is the same shape:
a `provider.ts` interface, domain-owned `types.ts`, and interchangeable implementations selected by
one environment variable in `index.ts`. Three of them offer `stub` / `mock` / `live`; `payout` offers
`manual` / `mock` / `papara`, because for payouts the do-nothing default is a human making a bank
transfer rather than an inert stub. Application code imports only `getPaymentProvider()` and never
sees an Iyzico field name.

Three things fall out of this. Development runs with `mock` and needs no API keys — the image mock
does a real sharp-based color enhancement, so the whole upload → enhance → approve flow can be
exercised offline. A provider configured as `live` (or `papara`) with missing credentials **logs a
warning and degrades to its safe default** rather than crashing at boot. And because each
integration is switched independently, the half-finished ones could stay in the tree without
blocking the rest of the product — which is exactly what happened to 3D/AR, live payments and the
Gemini enhancer.

**Fallback chains where a hard failure would be worse than a soft one.**
`POST /api/dishes/enhance` tries the configured Gemini provider and, on any error (quota, billing,
a shape change in the response), falls back to the local sharp enhancement rather than returning an
error. The user always gets a result, and the better result would arrive automatically if the Gemini
provider were ever configured. In practice the sharp path is the only one that has ever run.

**Balances derived, never stored.**
There is no `Balance` table. `getAffiliateBalance()` computes available / locked / withdrawn by
grouping `Commission` rows on status. A withdrawal request atomically flips its commissions
`earned → requested` inside a transaction, so the money can only be in one bucket. This trades a
`GROUP BY` per page load for the elimination of double-entry drift, which for a payout system is the
right side of that trade.

**Tax values are snapshotted at request time.**
The withholding rate resolves DB setting → env override → constant, but once a withdrawal is
created, the rate, the gross, the withholding, the net, the IBAN and the tax-document URL are all
frozen onto the row. Later rate changes by the accountant cannot rewrite the history of a request
that has already been approved.

**Idempotency and TOCTOU guards on anything that spends money or quota.**
`fulfillPackage()` can be called twice for the same payment without writing a second commission
(one-time referrals check for an existing row; recurring ones deduplicate on `paymentRef`). Marking
a 3D model ready uses `updateMany({ where: { modelStatus: { not: ready } } })` and only decrements
quota when `count === 1`, so two racing pollers cannot bill the tenant twice. Closing a tab uses the
same pattern against `status: "open"` and returns 409 on the loser.

**Centralized authorization instead of database RLS.**
`src/lib/auth/guard.ts` exposes one `require*Context()` function per role, each returning an already
scoped object (`requireOwnerContext()` returns the caller's restaurant and menu, not just a user ID),
so a handler cannot read outside its tenant without deliberately going around the guard. `apiHandler()`
wraps each route and maps `HttpError` to a JSON status, keeping handlers free of try/catch. Twelve of
the sensitive endpoints — registration, login, password reset, upload, AI enhance, withdrawals,
chat — add a Redis fixed-window rate limit on top.

**Theme JSON is treated as untrusted input, twice.**
Tenant theme settings are interpolated into CSS on a public page, which is an injection and SSRF
surface. The Zod schema constrains colors to `#rrggbb`, font names to `[A-Za-z0-9 ]{1,40}`,
background images to a BunnyCDN or `/uploads` allowlist, and gradients to a `linear|radial-gradient`
character whitelist. Then `theme/css.ts` strips quotes, parentheses and semicolons again at render
time — defense in depth, on the assumption that the write gate might one day be bypassed.

**Client IP is read defensively.**
`clientIp()` prefers `X-Real-IP` (which nginx sets from the real `$remote_addr`) and, when falling
back to `X-Forwarded-For`, takes the **rightmost** entry — the left end is attacker-controlled, and
using it would let anyone bypass every rate limit by spoofing a header.

**Secrets and business rules live in the environment.**
`src/lib/env.ts` parses the entire environment through Zod at boot and fails loudly on a bad config;
it also exports an `integrations` object so the UI can ask "is Bunny configured?" instead of
guessing. Commission rates and the platform fee are business-sensitive and default to `0` when
unset, so the repository never carries the real numbers. Legal pages read company identity from env
and render a `[PLACEHOLDER]` with `companyConfigured() === false` when it is missing, which prevents
publishing legally incomplete pages by accident.

**Production image.**
Four-stage Dockerfile (`deps` → `builder` → `migrator` → `runner`) producing a Next.js standalone
output that runs as a non-root user. Compose gates `web` behind
`migrate: service_completed_successfully` and `db: service_healthy`, so migrations always land before
the app starts. Build-time placeholders satisfy the env schema during `next build`; real secrets
arrive at runtime via `env_file`.

## Getting started

Requires Node 22+, Docker, and npm.

```bash
git clone <repo-url> kafe && cd kafe

# 1) Infrastructure (PostgreSQL 16 + Redis 7)
docker compose up -d

# 2) Environment
cp .env.example .env
npx auth secret          # writes AUTH_SECRET

# 3) Dependencies and schema
npm install
npx prisma migrate dev   # also runs prisma generate

# 4) Run
npm run dev              # http://localhost:3000
```

Multi-tenancy works locally: with `NEXT_PUBLIC_ROOT_DOMAIN=localhost`, a tenant with slug
`kahvecim` is reachable at `http://kahvecim.localhost:3000`.

Every integration is optional. With the defaults in `.env.example` the app boots with payments,
3D and AI disabled, images written to `public/uploads`, and email off. To exercise a flow without
credentials, set the relevant provider to `mock`:

```bash
PAYMENT_PROVIDER=mock      # checkout succeeds instantly
NANOBANANA_PROVIDER=mock   # real sharp-based enhancement, no API key
ARCODE_PROVIDER=mock       # sample .glb/.usdz models in the viewer
PAYOUT_PROVIDER=mock       # withdrawals mark themselves paid
```

`.env.example` covers the core and the older integrations; **`src/lib/env.ts` is the authoritative
list** and documents the payment, payout and AI variables inline.

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

Production deploy is `docker compose -f docker-compose.prod.yml up -d --build`, which brings up
migrate, web, PostgreSQL, Redis and nginx. nginx terminates TLS with a Cloudflare origin certificate
for the apex and `*.dijitalkafe.com`, and serves `/uploads` straight from the shared volume because
the Next.js standalone runtime does not.

## Known limitations

Stated plainly, because they are real.

- **The 3D/AR integration is a stub.** The database fields, quota accounting, upload UI, status
  badges, polling and `model-viewer` modal are all built and work against `ARCODE_PROVIDER=mock`,
  but `src/lib/services/arcode/live.ts` still carries **three unresolved `TODO(arcode)` blocks**
  (endpoint paths, response field mapping, status vocabulary). The vendor plan was never purchased,
  so the live path was never verified against the real API. The default is `stub`; 3D was not
  advertised to the pilot customers.
- **The Iyzico live path was never verified against the real API.** The authV2 HMAC signing,
  request building, callback route and the whole surrounding flow (fulfillment, commissions, order
  status, UI) are written, but `src/lib/services/payment/live.ts` still carries `TODO(iyzico)`
  markers on the request field names and the response path, and its header comment is a checklist
  for "once the key arrives". Merchant credentials were never obtained, so `PAYMENT_PROVIDER`
  never left its `stub` default. Treat the Iyzico integration as a written-but-unproven reference,
  not as a payment path known to work.
- **Recurring subscription billing is not implemented either.** `/api/cron/renewals` expires trials
  and honors cancellations correctly, but it only auto-renews when `PAYMENT_PROVIDER=mock`. Real
  renewal would need Iyzico stored-card recurring charges; under `live`, subscriptions expire at
  period end and the customer would have to pay again manually.
- **The Gemini image enhancer was never keyed.** `src/lib/services/nanobanana/live.ts` carries a
  `TODO(nanobanana)` on the response schema and an explicit note to confirm that real output bytes
  come back at all. The default provider is `stub`, which hides the enhance button outright; `mock`
  runs a local sharp color pass instead. The AI enhancement described under Features therefore
  shipped as the sharp version, not as Gemini.
- **The Papara payout provider is unverified.** Its endpoint, header name and success condition
  carry `TODO(papara)` markers. The shipped default is `manual`: the admin approves a request and
  transfers the money by bank/CSV, then marks it paid.
- **There are no automated tests.** Zero test files in the repository. Correctness rests on
  TypeScript, Zod schemas at every boundary, and manual testing. The pure business logic
  (`withdrawal/calc.ts`, `subscription/access.ts`, `theme/css.ts`) was deliberately written as
  side-effect-free functions and is the obvious place to start.
- **The chat feature assumes a single web container.** The private two-person chat (text and voice
  notes, access restricted to two user UUIDs from an env var) uses an in-process `EventEmitter` on
  `globalThis` for SSE fan-out and an in-memory presence counter. Correct for the one-container
  deployment it shipped on; it would need Redis pub/sub to run more than one replica. Presence
  resets on restart.
- **Local image storage does not scale horizontally either.** Without BunnyCDN configured, uploads
  are written to a container volume served by nginx — fine for one node, wrong for several.
- **Rate limiting is a fixed window,** so up to 2× the limit can pass across a window boundary. A
  sliding window or token bucket would be the fix.
- **The interface is Turkish only.** Copy, validation messages, route paths (`/panel`, `/adisyon`,
  `/komisyoncu`) and code comments are in Turkish; there is no i18n layer. The code itself is
  English-named.
- **Tax logic is jurisdiction-specific and needs professional review.** The withholding model
  targets Turkish rules for commission paid to individuals; the default rate is a documented
  assumption, and `constants.ts` says so.

## Status

**Shut down.** The platform ran in production on `dijitalkafe.com` with **2 pilot cafés** before it
was retired. Their subscription fees were not collected through the in-app Iyzico checkout, which
never went live. The product did not reach a customer base that justified continuing to operate it,
so the venture was closed.

The repository is published as a **reference implementation** — a real multi-tenant SaaS with a
multi-role permission model, financial reconciliation, a written (if unproven) payment integration,
and a Docker deployment, rather than a demo. The live site is left running as a portfolio artifact;
no new sign-ups are being taken. Personal data, company identity and commission rates were moved out
of the code and into environment variables before publication.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

This is a running commercial product, not a reference implementation. The AGPL is deliberate: anyone may read, learn from, and modify this code, but running a modified version as a network service requires publishing the source of that version. Copyright is held by the author, so separate commercial terms can be arranged on request.
