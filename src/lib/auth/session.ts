import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getChatUser } from "@/lib/chat/access";
import { landingPathForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

// Oturumdaki kullanıcı (yoksa null).
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

// Sayfa/layout için: giriş yoksa /giris'e yönlendirir.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

// Kullanıcının restoranı + menüsü (onboarding kontrolü için).
export async function getUserRestaurant(userId: string) {
  return prisma.restaurant.findUnique({
    where: { userId },
    include: { menu: true },
  });
}

// Dashboard için: restoran yoksa onboarding'e yönlendirir.
export async function requireRestaurant(userId: string) {
  const restaurant = await getUserRestaurant(userId);
  if (!restaurant) {
    // İşletmesi olmayan sohbet üyesi onboarding'e değil sohbete gider.
    // (Onboarding'in kendisi de bu fonksiyonu çağırdığı için aksi halde
    // sonsuz yönlendirme döngüsü oluşurdu.)
    if (await getChatUser()) redirect("/sohbet");
    redirect("/onboarding");
  }
  return restaurant;
}

// --- Rol bazlı erişim (çok aktörlü panel) ---

// Sadece owner: başka rol kendi paneline yönlendirilir.
export async function requireOwnerRole() {
  const user = await requireUser();
  if (user.role && user.role !== "owner") {
    redirect(landingPathForRole(user.role));
  }
  return user;
}

// Sadece admin.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect(landingPathForRole(user.role));
  return user;
}

// Komisyon yöneticisi (yalnız komisyoncu hesabı açar).
export async function requireAffiliateManager() {
  const user = await requireUser();
  if (user.role !== "affiliate_manager") {
    redirect(landingPathForRole(user.role));
  }
  return user;
}

// Çalışan (garson) + bağlı restoran. Yoksa girişe.
export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "staff") redirect(landingPathForRole(user.role));
  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff || !staff.isActive) redirect("/giris");
  return { user, staff };
}

// Adisyon ekranı için: patron VEYA çalışan → restaurantId. Diğer roller yönlenir.
export async function requireRestaurantActorPage() {
  const user = await requireUser();
  if (user.role === "owner") {
    const r = await prisma.restaurant.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!r) redirect("/onboarding");
    return { user, restaurantId: r.id, role: "owner" as const };
  }
  if (user.role === "staff") {
    const s = await prisma.staff.findUnique({ where: { userId: user.id } });
    if (!s || !s.isActive) redirect("/giris");
    return { user, restaurantId: s.restaurantId, role: "staff" as const };
  }
  redirect(landingPathForRole(user.role));
}

// Mali müşavir (stopaj/gider pusulası/vergi raporları).
export async function requireAccountant() {
  const user = await requireUser();
  if (user.role !== "accountant") {
    redirect(landingPathForRole(user.role));
  }
  return user;
}

// QR üretici + profili (yoksa girişe).
export async function requireVendor() {
  const user = await requireUser();
  if (user.role !== "qr_vendor") redirect(landingPathForRole(user.role));
  const vendor = await prisma.qrVendor.findUnique({
    where: { userId: user.id },
  });
  if (!vendor) redirect("/giris");
  return { user, vendor };
}

// Komisyoncu + profili (yoksa girişe).
export async function requireAffiliate() {
  const user = await requireUser();
  if (user.role !== "affiliate") redirect(landingPathForRole(user.role));
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: user.id },
  });
  if (!affiliate) redirect("/giris");
  return { user, affiliate };
}
