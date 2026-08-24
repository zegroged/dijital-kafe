import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { phoneSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1, "Ad gerekli").max(80),
  phone: phoneSchema,
  password: z.string().min(8, "Şifre en az 8 karakter").max(72),
});

// GET /api/staff → restoranın çalışanları
export const GET = apiHandler(async () => {
  const { restaurant } = await requireOwnerContext();
  const staff = await prisma.staff.findMany({
    where: { restaurantId: restaurant.id },
    include: { user: { select: { phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok({ ok: true, staff });
});

// POST /api/staff { name, phone, password } → çalışan hesabı (telefonla giriş)
export const POST = apiHandler(async (req) => {
  const { restaurant } = await requireOwnerContext();
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const { name, phone, password } = parsed.data;

  const exists = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (exists) return fail("Bu telefon zaten kayıtlı", 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      name,
      role: "staff",
      staff: { create: { restaurantId: restaurant.id, name } },
    },
    select: { id: true },
  });
  return ok({ ok: true, userId: user.id }, 201);
});
