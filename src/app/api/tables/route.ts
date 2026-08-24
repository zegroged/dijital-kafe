import { apiHandler, requireOwnerContext } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1, "Masa adı gerekli").max(40),
});

// GET /api/tables → restoranın masaları
export const GET = apiHandler(async () => {
  const { restaurant } = await requireOwnerContext();
  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return ok({ ok: true, tables });
});

// POST /api/tables { name } → masa ekle
export const POST = apiHandler(async (req) => {
  const { restaurant } = await requireOwnerContext();
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz veri");
  }
  const count = await prisma.restaurantTable.count({
    where: { restaurantId: restaurant.id },
  });
  const table = await prisma.restaurantTable.create({
    data: {
      restaurantId: restaurant.id,
      name: parsed.data.name,
      sortOrder: count,
    },
  });
  return ok({ ok: true, table }, 201);
});
