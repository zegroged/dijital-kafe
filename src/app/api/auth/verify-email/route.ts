import { createHash } from "node:crypto";
import { apiHandler } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(1, "Geçersiz bağlantı") });

// POST /api/auth/verify-email { token } → e-postayı doğrula (emailVerified dolar).
export const POST = apiHandler(async (req) => {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Geçersiz bağlantı", 400);
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");

  // Atomik sahiplenme: geçerli & kullanılmamış jetonu tek seferde "kullanıldı" yap.
  const claim = await prisma.emailVerificationToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claim.count !== 1) {
    return fail("Bağlantı geçersiz veya süresi dolmuş. Panelinden yeni mail iste.", 400);
  }

  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });
  if (!row) return fail("Bağlantı geçersiz.", 400);

  await prisma.user.update({
    where: { id: row.userId },
    data: { emailVerified: new Date() },
  });

  return ok({ ok: true });
});
