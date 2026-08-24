import { type ChatRow, publishChat } from "@/lib/chat/bus";
import { prisma } from "@/lib/prisma";

// Sohbet mesajları için ortak seçim/serileştirme + okundu işaretleme.
// Ses ham verisi (ChatAudio) BİLİNÇLİ olarak dışarıda — liste sorguları blob çekmesin.

export const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  kind: true,
  body: true,
  audioMime: true,
  durationMs: true,
  readAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true, // mutabakat imleci (istemciye gönderilmez)
} as const;

export interface ChatMsgDTO {
  id: string;
  mine: boolean;
  kind: "text" | "voice";
  body: string | null;
  audioMime: string | null;
  durationMs: number | null;
  readAt: string | null;
  deleted: boolean;
  createdAt: string;
}

// Alıcıya göre serileştirir (mine bayrağı kişiye özel).
export function serializeMessage(m: ChatRow, meId: string): ChatMsgDTO {
  const deleted = Boolean(m.deletedAt);
  return {
    id: m.id,
    mine: m.senderId === meId,
    kind: m.kind,
    // Silinmiş mesajın içeriği hiç gönderilmez.
    body: deleted ? null : m.body,
    audioMime: deleted ? null : m.audioMime,
    durationMs: deleted ? null : m.durationMs,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    deleted,
    createdAt: m.createdAt.toISOString(),
  };
}

// Karşı tarafın okunmamış mesajlarını okundu yapar. Değişiklik olduysa olay
// yayınlar → gönderen anında ✓✓ görür.
export async function markPartnerMessagesRead(meId: string): Promise<number> {
  const at = new Date();
  const res = await prisma.chatMessage.updateMany({
    where: { senderId: { not: meId }, readAt: null },
    data: { readAt: at },
  });
  if (res.count > 0) {
    publishChat({ kind: "read", at: at.toISOString(), readerId: meId });
  }
  return res.count;
}
