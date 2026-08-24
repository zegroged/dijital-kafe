import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { approveWithdrawal, WithdrawalError } from "@/lib/withdrawal/request";

export const runtime = "nodejs";

// POST /api/admin/withdrawals/:id/approve
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    await requireAdminContext();
    const { id } = await ctx.params;
    try {
      await approveWithdrawal(id);
      return ok({ ok: true });
    } catch (e) {
      if (e instanceof WithdrawalError) return fail(e.message, e.status);
      throw e;
    }
  },
);
