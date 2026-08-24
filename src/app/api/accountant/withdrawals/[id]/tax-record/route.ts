import { apiHandler, requireAccountantContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

// Mali müşavir, bir çekim için gider pusulası / fatura kaydını işler.
const schema = z.object({
  taxDocumentNo: z.string().trim().max(120).optional(),
  taxDocumentAt: z.string().trim().optional(), // YYYY-MM-DD
  taxNote: z.string().trim().max(500).optional(),
  recorded: z.boolean().optional(),
});

// POST /api/accountant/withdrawals/:id/tax-record
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    await requireAccountantContext();
    const { id } = await ctx.params;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
    }
    const { taxDocumentNo, taxDocumentAt, taxNote, recorded } = parsed.data;

    let docAt: Date | null = null;
    if (taxDocumentAt) {
      const d = new Date(taxDocumentAt);
      if (Number.isNaN(d.getTime())) return fail("Geçersiz tarih");
      docAt = d;
    }

    const res = await prisma.withdrawalRequest.updateMany({
      where: { id },
      data: {
        taxRecorded: recorded ?? true,
        taxDocumentNo: taxDocumentNo ?? null,
        taxDocumentAt: docAt,
        taxNote: taxNote ?? null,
      },
    });
    if (res.count !== 1) return fail("Talep bulunamadı", 404);

    return ok({ ok: true });
  },
);
