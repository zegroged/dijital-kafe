import { apiHandler, requireAffiliateManagerContext } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { COMMISSION_RATE_BY_TYPE } from "@/lib/constants";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { phoneSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  // Komisyoncu TELEFON ile açılır/giriş yapar. E-posta BURADA alınmaz:
  // komisyoncu ilk girişte kendi panelinden e-postasını girip doğrular →
  // ancak o zaman referans kodu AKTİF olur (emailVerified null → pasif).
  phone: phoneSchema,
  password: z.string().min(8, "Şifre en az 8 karakter").max(72),
  name: z.string().trim().max(120).optional(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{3,40}$/, "Kod 3-40 harf/rakam olmalı")
    .optional(),
  // Kazanç modeli: oran tipten türetilir (one_time %70 / recurring %30).
  commissionType: z.enum(["one_time", "recurring"]).default("one_time"),
});

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(): string {
  let s = "REF";
  for (let i = 0; i < 6; i++)
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// GET /api/admin/affiliates → liste
export const GET = apiHandler(async () => {
  await requireAffiliateManagerContext();
  const affiliates = await prisma.affiliate.findMany({
    include: {
      user: {
        select: { email: true, phone: true, name: true, emailVerified: true },
      },
      _count: { select: { referrals: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok({ ok: true, affiliates });
});

// POST /api/admin/affiliates { phone, password, name?, code?, commissionType }
// Komisyoncu hesabı + benzersiz referans kodu oluşturur. E-posta ALINMAZ;
// kod, komisyoncu ilk girişte e-postasını doğrulayana kadar PASİF kalır.
export const POST = apiHandler(async (req) => {
  await requireAffiliateManagerContext();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const { phone, password, name, commissionType } = parsed.data;
  const commissionRate = COMMISSION_RATE_BY_TYPE[commissionType];

  const exists = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (exists) return fail("Bu telefon zaten kayıtlı", 409);

  // Benzersiz kod (verilmişse onu, yoksa üret).
  let code = parsed.data.code?.toUpperCase() ?? randomCode();
  for (let i = 0; i < 12; i++) {
    const taken = await prisma.affiliate.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!taken) break;
    if (parsed.data.code) return fail("Bu kod kullanımda", 409);
    code = randomCode();
  }

  const passwordHash = await hashPassword(password);
  // emailVerified varsayılan null → kod, komisyoncu e-postasını doğrulayana
  // kadar pasiftir.
  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      name: name ?? null,
      role: "affiliate",
      affiliate: {
        create: {
          code,
          commissionType,
          commissionRate,
        },
      },
    },
    select: { id: true },
  });

  return ok({ ok: true, userId: user.id, code }, 201);
});
