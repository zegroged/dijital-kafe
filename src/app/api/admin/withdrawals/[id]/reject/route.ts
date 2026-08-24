import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { rejectWithdrawal, WithdrawalError } from "@/lib/withdrawal/request";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ reason: z.string().trim().min(1).max(300) });

// POST /api/admin/withdrawals/:id/reject { reason } → komisyonlar bakiyeye döner.
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    await requireAdminContext();
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Red sebebi gerekli");
    try {
      await rejectWithdrawal(id, parsed.data.reason);
      return ok({ ok: true });
    } catch (e) {
      if (e instanceof WithdrawalError) return fail(e.message, e.status);
      throw e;
    }
  },
);
