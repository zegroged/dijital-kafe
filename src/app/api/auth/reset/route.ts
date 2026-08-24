import { createHash } from "node:crypto";
import { apiHandler } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(1, "Geçersiz bağlantı"),
  password: passwordSchema,
});

// POST /api/auth/reset { token, password } → şifreyi sıfırla.
export const POST = apiHandler(async (req) => {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // Atomik sahiplenme: geçerli & kullanılmamış jetonu tek seferde "kullanıldı" yap.
  const claim = await prisma.passwordResetToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claim.count !== 1) {
    return fail("Bağlantı geçersiz veya süresi dolmuş. Yeniden talep et.", 400);
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });
  if (!row) return fail("Bağlantı geçersiz.", 400);

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    // Güvenlik: aynı kullanıcının kalan diğer sıfırlama linklerini de geçersiz kıl.
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return ok({ ok: true });
});
