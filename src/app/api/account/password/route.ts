import { auth } from "@/auth";
import { apiHandler, HttpError } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { fail, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: passwordSchema,
});

// POST /api/account/password { currentPassword, newPassword }
// Giriş yapmış HER kullanıcı kendi şifresini değiştirir.
export const POST = apiHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");

  const rl = await rateLimit(`pwchange:${session.user.id}`, 5, 600);
  if (!rl.ok) return fail("Çok fazla deneme. Biraz sonra tekrar deneyin.", 429);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) throw new HttpError(404, "Kullanıcı bulunamadı");

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return fail("Mevcut şifre hatalı", 400);

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return ok({ ok: true });
});
