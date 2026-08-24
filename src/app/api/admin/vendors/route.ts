import { apiHandler, requireAdminContext } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.email("Geçerli e-posta girin").toLowerCase(),
  password: z.string().min(8, "Şifre en az 8 karakter").max(72),
  companyName: z.string().trim().min(2, "Firma adı gerekli").max(120),
});

// GET /api/admin/vendors → liste
export const GET = apiHandler(async () => {
  await requireAdminContext();
  const vendors = await prisma.qrVendor.findMany({
    include: {
      user: { select: { email: true } },
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok({ ok: true, vendors });
});

// POST /api/admin/vendors { email, password, companyName }
// QR lazer üreticisi hesabı oluşturur.
export const POST = apiHandler(async (req) => {
  await requireAdminContext();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const { email, password, companyName } = parsed.data;

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
      role: "qr_vendor",
      emailVerified: new Date(),
      qrVendor: { create: { companyName } },
    },
    select: { id: true },
  });

  return ok({ ok: true, userId: user.id }, 201);
});
