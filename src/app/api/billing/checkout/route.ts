import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { PLANS, type PlanKey, ROOT_DOMAIN, withKdv } from "@/lib/constants";
import { fail, getClientIp, ok } from "@/lib/http";
import { fulfillPackage } from "@/lib/payment/fulfill";
import { getPaymentProvider } from "@/lib/services/payment";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ plan: z.enum(["basic", "premium"]) });

// POST /api/billing/checkout { plan } → paket ödemesi başlat
// mock → anında aktif + (referans varsa) komisyon earned; live → checkout URL.
export const POST = apiHandler(async (req) => {
  const { userId, restaurant } = await requireOwnerContext();

  const provider = getPaymentProvider();
  if (!provider.isConfigured()) {
    return fail("Ödeme henüz aktif değil", 409);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Geçersiz paket");
  const plan = parsed.data.plan as PlanKey;

  const result = await provider.createCheckout({
    purpose: "package",
    refId: userId,
    // Müşteriden KDV dahil tahsil edilir; komisyon NET fiyat üzerinden (fulfill).
    amount: withKdv(PLANS[plan].priceMonthly),
    description: `${PLANS[plan].label} (KDV dahil)`,
    buyer: {
      id: userId,
      email: restaurant.user.email ?? "",
      name: restaurant.user.name ?? restaurant.businessName,
      ip: getClientIp(req),
      phone: restaurant.phone ?? undefined,
    },
    address: {
      contactName: restaurant.businessName,
      address: restaurant.address ?? undefined,
    },
    callbackUrl: `https://${ROOT_DOMAIN}/api/payment/callback`,
    meta: plan,
  });

  if (result.paid) {
    await fulfillPackage(userId, plan);
    return ok({ ok: true, plan });
  }
  return ok({ ok: true, checkoutUrl: result.checkoutUrl, token: result.token });
});
