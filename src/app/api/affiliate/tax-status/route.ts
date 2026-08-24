import { apiHandler, requireAffiliateContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  taxStatus: z.enum(["individual_no_tax", "tax_registered"]),
  taxDocUrl: z.string().trim().max(500).optional(),
});

// POST /api/affiliate/tax-status { taxStatus, taxDocUrl? }
// Komisyoncu vergi durumunu kaydeder; mükellefse belge URL'i (önce yüklenmiş) eklenir.
export const POST = apiHandler(async (req) => {
  const { affiliate } = await requireAffiliateContext();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const { taxStatus, taxDocUrl } = parsed.data;

  if (taxStatus === "tax_registered" && !taxDocUrl && !affiliate.taxDocUrl) {
    return fail("Vergi mükellefi için belge (vergi levhası) yüklemelisin.");
  }

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { taxStatus, ...(taxDocUrl ? { taxDocUrl } : {}) },
  });

  return ok({ ok: true });
});
