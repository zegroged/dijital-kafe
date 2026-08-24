import { apiHandler, requireAffiliateContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { cancelWithdrawal, WithdrawalError } from "@/lib/withdrawal/request";

export const runtime = "nodejs";

// POST /api/affiliate/withdrawals/:id/cancel → kendi bekleyen talebini iptal et.
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { affiliate } = await requireAffiliateContext();
    const { id } = await ctx.params;
    try {
      await cancelWithdrawal(affiliate.id, id);
      return ok({ ok: true });
    } catch (e) {
      if (e instanceof WithdrawalError) return fail(e.message, e.status);
      throw e;
    }
  },
);
