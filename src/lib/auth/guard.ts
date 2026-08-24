import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// MERKEZÎ GÜVENLİK — RLS yerine. Her korumalı API/sayfa, kullanıcının
// SADECE kendi verisine eriştiğinden emin olmak için bunları kullanır.
// ============================================================

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Giriş yapmış kullanıcının restoranı + menüsü + aboneliği.
export async function requireOwnerContext() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");

  const restaurant = await prisma.restaurant.findUnique({
    where: { userId: session.user.id },
    include: {
      menu: true,
      user: { include: { subscription: true } },
    },
  });
  if (!restaurant?.menu) throw new HttpError(403, "Restoran bulunamadı");

  return {
    userId: session.user.id,
    restaurant,
    menu: restaurant.menu,
    subscription: restaurant.user.subscription,
  };
}

export type OwnerContext = Awaited<ReturnType<typeof requireOwnerContext>>;

// API için admin kapısı (redirect değil, HttpError fırlatır).
export async function requireAdminContext() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");
  if (session.user.role !== "admin") throw new HttpError(403, "Yetkisiz");
  return { userId: session.user.id };
}

// API için QR üretici kapısı (üretici profilini döndürür).
export async function requireVendorContext() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");
  if (session.user.role !== "qr_vendor") throw new HttpError(403, "Yetkisiz");
  const vendor = await prisma.qrVendor.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) throw new HttpError(403, "Üretici profili yok");
  return { userId: session.user.id, vendor };
}

// API için "komisyoncu hesabı açabilen" kapı: admin VEYA komisyon yöneticisi.
export async function requireAffiliateManagerContext() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");
  if (
    session.user.role !== "admin" &&
    session.user.role !== "affiliate_manager"
  ) {
    throw new HttpError(403, "Yetkisiz");
  }
  return { userId: session.user.id, role: session.user.role };
}

// API için "restoran aktörü": patron VEYA o restoranın çalışanı. Adisyon/masa
// işlemlerini ikisi de yapabilir; restaurantId'yi role'e göre çözer.
export async function requireRestaurantActor() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");
  const role = session.user.role;
  if (role === "owner") {
    const r = await prisma.restaurant.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!r) throw new HttpError(403, "Restoran bulunamadı");
    return { userId: session.user.id, restaurantId: r.id, role: "owner" as const };
  }
  if (role === "staff") {
    const s = await prisma.staff.findUnique({
      where: { userId: session.user.id },
      select: { restaurantId: true, isActive: true },
    });
    if (!s || !s.isActive) throw new HttpError(403, "Çalışan profili yok veya pasif");
    return {
      userId: session.user.id,
      restaurantId: s.restaurantId,
      role: "staff" as const,
    };
  }
  throw new HttpError(403, "Yetkisiz");
}

// API için vergi/muhasebe kapısı: admin VEYA mali müşavir.
export async function requireAccountantContext() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");
  if (session.user.role !== "admin" && session.user.role !== "accountant") {
    throw new HttpError(403, "Yetkisiz");
  }
  return { userId: session.user.id, role: session.user.role };
}

// API için komisyoncu kapısı (komisyoncu profilini döndürür).
export async function requireAffiliateContext() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Giriş gerekli");
  if (session.user.role !== "affiliate") throw new HttpError(403, "Yetkisiz");
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
  });
  if (!affiliate) throw new HttpError(403, "Komisyoncu profili yok");
  return { userId: session.user.id, affiliate };
}

// Bir kategorinin bu menüye ait olduğunu doğrula (yoksa 404).
export async function assertCategoryInMenu(categoryId: string, menuId: string) {
  const c = await prisma.category.findFirst({
    where: { id: categoryId, menuId },
    select: { id: true },
  });
  if (!c) throw new HttpError(404, "Kategori bulunamadı");
}

// Bir yemeğin bu menüye ait olduğunu doğrula (yoksa 404).
export async function assertDishInMenu(dishId: string, menuId: string) {
  const d = await prisma.dish.findFirst({
    where: { id: dishId, menuId },
    select: { id: true },
  });
  if (!d) throw new HttpError(404, "Yemek bulunamadı");
}

// API handler'ı HttpError → JSON eşlemesiyle sarmalar.
export function apiHandler<C>(
  fn: (req: Request, ctx: C) => Promise<Response>,
): (req: Request, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json(
          { ok: false, error: e.message },
          { status: e.status },
        );
      }
      console.error("[api] beklenmeyen hata:", e);
      return NextResponse.json(
        { ok: false, error: "Sunucu hatası" },
        { status: 500 },
      );
    }
  };
}
