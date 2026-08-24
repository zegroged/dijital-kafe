import { EventEmitter } from "node:events";

// Süreç-içi olay yolu: mesaj gönderilir gönderilmez açık SSE bağlantılarına
// anında iletir (tek web container olduğu için Redis pub/sub gerekmez).
//
// DİKKAT: Next.js her route'u ayrı paketleyebildiği için modül birden fazla kez
// örneklenebilir → emitter globalThis'te tutulur, aksi halde /api/chat/messages
// ile /api/chat/stream FARKLI emitter görür ve olaylar hiç ulaşmaz.

export interface ChatRow {
  id: string;
  senderId: string;
  kind: "text" | "voice";
  body: string | null;
  audioMime: string | null;
  durationMs: number | null;
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatEvent =
  | { kind: "message"; row: ChatRow }
  | { kind: "read"; at: string; readerId: string }
  | { kind: "delete"; id: string }
  | { kind: "presence"; userId: string; online: boolean; lastSeen: number | null };

const g = globalThis as typeof globalThis & { __kafeChatBus?: EventEmitter };

export const chatBus: EventEmitter = (g.__kafeChatBus ??= (() => {
  const em = new EventEmitter();
  em.setMaxListeners(50); // 2 kişi × birkaç sekme; bolca pay
  return em;
})());

export const CHAT_EVENT = "chat";

export function publishChat(ev: ChatEvent): void {
  chatBus.emit(CHAT_EVENT, ev);
}

// --- Çevrimiçi durumu ---
// Açık SSE bağlantısı = kişi sohbette. Sekme başına bir bağlantı olduğu için
// sayaç tutulur (2 sekme açıksa biri kapanınca çevrimdışı sayılmasın).
// Bellekte: tek web container var; yeniden başlatmada sıfırlanır (herkes
// çevrimdışı görünür, ilk bağlantıda düzelir).

interface Presence {
  conns: number;
  lastSeen: number | null;
}

const presence: Map<string, Presence> = ((
  globalThis as typeof globalThis & { __kafeChatPresence?: Map<string, Presence> }
).__kafeChatPresence ??= new Map());

export function presenceJoin(userId: string): void {
  const p = presence.get(userId) ?? { conns: 0, lastSeen: null };
  p.conns += 1;
  presence.set(userId, p);
  if (p.conns === 1) {
    publishChat({ kind: "presence", userId, online: true, lastSeen: null });
  }
}

export function presenceLeave(userId: string): void {
  const p = presence.get(userId);
  if (!p) return;
  p.conns = Math.max(0, p.conns - 1);
  if (p.conns === 0) {
    p.lastSeen = Date.now();
    publishChat({
      kind: "presence",
      userId,
      online: false,
      lastSeen: p.lastSeen,
    });
  }
  presence.set(userId, p);
}

export function presenceOf(userId: string): {
  online: boolean;
  lastSeen: number | null;
} {
  const p = presence.get(userId);
  return { online: (p?.conns ?? 0) > 0, lastSeen: p?.lastSeen ?? null };
}
