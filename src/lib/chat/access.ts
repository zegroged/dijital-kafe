import { auth } from "@/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

// ============================================================
// Özel sohbet erişim kilidi.
//
// Üyeler env `CHAT_MEMBER_IDS` ile DEĞİŞMEZ kullanıcı id'si (profiles.id UUID)
// olarak tanımlanır. E-posta/telefon ile tanımlamak GÜVENSİZDİR: bu alanlar
// sahiplenilebilir — herhangi bir işletme sahibi POST /api/staff ile istediği
// telefonla hesap açabiliyor, anonim kayıt istediği e-postayı alabiliyor. Boşta
// duran bir anahtar bu yolla kapılırsa saldırgan tüm sohbeti okuyabilirdi.
// UUID seçilemez → bu sınıf saldırı tamamen kapanır.
//
// Listede olmayan HERKES — admin dahil — 404 görür (403 değil: özelliğin
// varlığını bile sızdırmamak için).
// ============================================================

export interface ChatUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
}

const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
} as const;

function memberIds(): string[] {
  return (env.CHAT_MEMBER_IDS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// En az 2 id tanımlı değilse özellik tamamen kapalıdır.
export function chatEnabled(): boolean {
  return memberIds().length >= 2;
}

// Oturumdaki kullanıcı sohbet üyesiyse döner, değilse null.
export async function getChatUser(): Promise<ChatUser | null> {
  if (!chatEnabled()) return null;
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !memberIds().includes(id.toLowerCase())) return null;

  return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
}

// Sohbetteki diğer kişi (karşı taraf).
export async function getChatPartner(meId: string): Promise<ChatUser | null> {
  const others = memberIds().filter((i) => i !== meId.toLowerCase());
  if (!others.length) return null;
  return prisma.user.findFirst({
    where: { id: { in: others } },
    select: USER_SELECT,
  });
}

// Sohbete dahil TÜM kullanıcı id'leri (mesaj sorgularını bunlarla sınırlarız).
export async function chatMemberIds(): Promise<string[]> {
  return chatEnabled() ? memberIds() : [];
}
