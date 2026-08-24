import { apiHandler, requireAffiliateContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

// Komisyoncu, ödemenin yapılacağı IBAN/ad bilgisini girer (admin buradan görür).
const schema = z.object({
  holder: z.string().trim().min(2, "Ad Soyad gerekli").max(120),
  iban: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s+/g, "").toUpperCase())
    .pipe(z.string().regex(/^TR\d{24}$/, "Geçerli bir TR IBAN girin")),
  bank: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
});

// POST /api/affiliate/payout-info { holder, iban, bank?, note? }
export const POST = apiHandler(async (req: Request) => {
  const { affiliate } = await requireAffiliateContext();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { payoutInfo: parsed.data },
  });

  return ok({ ok: true });
});
