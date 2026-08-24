import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.email("Geçerli e-posta girin").toLowerCase(),
  password: z.string().min(8, "Şifre en az 8 karakter").max(72),
  name: z.string().trim().max(120).optional(),
});

// POST /api/admin/accountants { email, password, name? }
// SADECE admin: mali müşavir hesabı oluşturur.
export const POST = apiHandler(async (req) => {
  await requireAdminContext();

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const { email, password, name } = parsed.data;

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (exists) return fail("Bu e-posta zaten kayıtlı", 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
      role: "accountant",
      emailVerified: new Date(),
    },
    select: { id: true },
  });

  return ok({ ok: true, userId: user.id }, 201);
});
