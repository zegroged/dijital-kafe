import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { recoverProcessing, WithdrawalError } from "@/lib/withdrawal/request";

export const runtime = "nodejs";

// POST /api/admin/withdrawals/:id/recover
// Crash sonucu "gönderiliyor" (processing) durumunda asılı kalmış talebi onaya
// geri alır (yeniden ödenebilir). manual/mock'ta güvenli; live async sağlayıcıda
// önce paranın gitmediğinden emin olunmalı.
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    await requireAdminContext();
    const { id } = await ctx.params;
    try {
      await recoverProcessing(id);
      return ok({ ok: true });
    } catch (e) {
      if (e instanceof WithdrawalError) return fail(e.message, e.status);
      throw e;
    }
  },
);
