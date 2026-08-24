import {
  CHAT_EVENT,
  type ChatEvent,
  chatBus,
  presenceJoin,
  presenceLeave,
  presenceOf,
} from "@/lib/chat/bus";
import { chatMemberIds, getChatUser } from "@/lib/chat/access";
import { serializeMessage } from "@/lib/chat/message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/stream → Server-Sent Events. Mesaj gönderilir gönderilmez
// karşı tarafa ANINDA düşer (yenileme/bekleme yok).
//
// Başlıklar kritik: "X-Accel-Buffering: no" nginx'in, "no-transform" Cloudflare'ın
// akışı tamponlamasını engeller — aksi halde olaylar bağlantı kapanana dek birikir.
export async function GET(req: Request) {
  const me = await getChatUser();
  if (!me) return new Response("Not found", { status: 404 });
  const meId = me.id;
  const partnerId = (await chatMemberIds()).find((id) => id !== meId) ?? null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const send = (data: unknown) => write(`data: ${JSON.stringify(data)}\n\n`);

      const onEvent = (ev: ChatEvent) => {
        if (ev.kind === "message") {
          send({ kind: "message", message: serializeMessage(ev.row, meId) });
        } else if (ev.kind === "read") {
          // Kendi okuma olayımı bana geri göndermeye gerek yok.
          if (ev.readerId !== meId) send({ kind: "read", at: ev.at });
        } else if (ev.kind === "presence") {
          // Sadece KARŞI tarafın durumu ilgilendirir.
          if (ev.userId !== meId) {
            send({
              kind: "presence",
              online: ev.online,
              lastSeen: ev.lastSeen,
            });
          }
        } else {
          send({ kind: "delete", id: ev.id });
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        chatBus.off(CHAT_EVENT, onEvent);
        clearInterval(heartbeat);
        presenceLeave(meId); // karşı taraf "son görülme" görsün
        try {
          controller.close();
        } catch {
          /* zaten kapalı */
        }
      };

      // Ara sunucuların boşta kalan bağlantıyı düşürmemesi için nabız.
      const heartbeat = setInterval(() => write(`: ping\n\n`), 20_000);

      chatBus.on(CHAT_EVENT, onEvent);
      req.signal.addEventListener("abort", cleanup);
      presenceJoin(meId); // karşı taraf beni "çevrimiçi" görsün

      // İlk tampon doldurma: bazı ara sunucular ilk baytı görene dek beklet.
      write(`retry: 3000\n\n`);
      send({ kind: "hello", now: new Date().toISOString() });
      // Karşı tarafın O ANKİ durumu (bağlanır bağlanmaz doğru göstersin).
      if (partnerId) {
        const p = presenceOf(partnerId);
        send({ kind: "presence", online: p.online, lastSeen: p.lastSeen });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
