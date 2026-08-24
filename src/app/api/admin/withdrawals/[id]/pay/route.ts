import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { payWithdrawal, WithdrawalError } from "@/lib/withdrawal/request";

export const runtime = "nodejs";

// POST /api/admin/withdrawals/:id/pay → payout sağlayıcısı üzerinden öde.
// manual/mock → anında paid; papara(live) → API çağrısı.
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    await requireAdminContext();
    const { id } = await ctx.params;
    try {
      const result = await payWithdrawal(id);
      return ok({ ok: true, ...result });
    } catch (e) {
      if (e instanceof WithdrawalError) return fail(e.message, e.status);
      throw e;
    }
  },
);
