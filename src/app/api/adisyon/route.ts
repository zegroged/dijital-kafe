import { apiHandler, requireRestaurantActor } from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const openSchema = z.object({ tableId: z.uuid() });

// GET /api/adisyon → açık adisyonlar (masa + toplam)
export const GET = apiHandler(async () => {
  const { restaurantId } = await requireRestaurantActor();
  const adisyonlar = await prisma.adisyon.findMany({
    where: { restaurantId, status: "open" },
    include: { table: { select: { name: true } }, _count: { select: { items: true } } },
    orderBy: { openedAt: "asc" },
  });
  return ok({ ok: true, adisyonlar });
});

// POST /api/adisyon { tableId } → masaya adisyon aç (zaten açıksa onu döndür)
export const POST = apiHandler(async (req) => {
  const { restaurantId, userId } = await requireRestaurantActor();
  const parsed = openSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Masa seçilmedi");

  const table = await prisma.restaurantTable.findFirst({
    where: { id: parsed.data.tableId, restaurantId },
    select: { id: true },
  });
  if (!table) return fail("Masa bulunamadı", 404);

  const existing = await prisma.adisyon.findFirst({
    where: { restaurantId, tableId: table.id, status: "open" },
    select: { id: true },
  });
  if (existing) return ok({ ok: true, id: existing.id, existing: true });

  const created = await prisma.adisyon.create({
    data: { restaurantId, tableId: table.id, openedById: userId },
    select: { id: true },
  });
  return ok({ ok: true, id: created.id, existing: false }, 201);
});
