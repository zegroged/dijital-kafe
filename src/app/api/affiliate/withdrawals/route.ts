import { apiHandler, requireAffiliateContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createWithdrawal, WithdrawalError } from "@/lib/withdrawal/request";

export const runtime = "nodejs";

// POST /api/affiliate/withdrawals → tüm çekilebilir bakiye için çekim talebi aç.
export const POST = apiHandler(async () => {
  const { userId, affiliate } = await requireAffiliateContext();

  const rl = await rateLimit(`withdraw:${userId}`, 10, 600);
  if (!rl.ok) return fail("Çok fazla deneme. Biraz sonra tekrar deneyin.", 429);

  try {
    const req = await createWithdrawal(affiliate.id);
    return ok(
      { ok: true, id: req.id, net: Number(req.netAmount) },
      201,
    );
  } catch (e) {
    if (e instanceof WithdrawalError) return fail(e.message, e.status);
    throw e;
  }
});
