import { apiHandler, requireAccountantContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { SETTING_WITHHOLDING_RATE, setSetting } from "@/lib/settings";
import { round3 } from "@/lib/withdrawal/calc";
import { z } from "zod";

export const runtime = "nodejs";

// Oran 0–1 arası (örn. 0.20 = %20). Decimal(4,3) ile uyum için 3 ondalığa normalize.
const schema = z.object({ rate: z.coerce.number().min(0).max(1) });

// POST /api/accountant/withholding-rate { rate } → stopaj oranını ayarla (DB).
// Yalnız yeni çekim taleplerini etkiler (geçmiş talepler snapshot'lı).
export const POST = apiHandler(async (req) => {
  await requireAccountantContext();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz oran");
  }

  const rate = round3(parsed.data.rate);
  await setSetting(SETTING_WITHHOLDING_RATE, String(rate));
  return ok({ ok: true, rate });
});
