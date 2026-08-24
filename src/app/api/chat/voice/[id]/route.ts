import { apiHandler } from "@/lib/auth/guard";
import { chatMemberIds, getChatUser } from "@/lib/chat/access";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/voice/:id → sesli mesajı stream et.
// Dosyalar public/uploads'a YAZILMADIĞI için bu route tek erişim yolu; sohbet
// üyesi olmayan (admin dahil) 404 alır. Range desteği iOS Safari için şart.
export const GET = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    const me = await getChatUser();
    if (!me) return fail("Bulunamadı", 404);
    const { id } = await ctx.params;

    const memberIds = await chatMemberIds();
    const msg = await prisma.chatMessage.findFirst({
      where: {
        id,
        kind: "voice",
        deletedAt: null,
        senderId: { in: memberIds },
      },
      select: { audioMime: true, audio: { select: { data: true } } },
    });
    if (!msg?.audio) return fail("Bulunamadı", 404);

    const bytes = new Uint8Array(msg.audio.data);
    const total = bytes.byteLength;
    const type = msg.audioMime ?? "audio/webm";
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      // Gizli içerik: ara sunucular/CDN önbelleğe almasın.
      "Cache-Control": "private, no-store",
    };

    // Kısmi istek (Safari sesi oynatmak için bunu bekler).
    const range = req.headers.get("range");
    const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
    if (m && (m[1] || m[2])) {
      let start: number;
      let end: number;
      if (!m[1]) {
        // Sonek biçimi: "bytes=-N" → SON N bayt (RFC 7233 §2.1).
        const n = Number(m[2]);
        if (!Number.isFinite(n) || n <= 0) {
          return new Response(null, {
            status: 416,
            headers: { ...headers, "Content-Range": `bytes */${total}` },
          });
        }
        start = Math.max(0, total - n);
        end = total - 1;
      } else {
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
      }
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start > end ||
        start >= total
      ) {
        return new Response(null, {
          status: 416,
          headers: { ...headers, "Content-Range": `bytes */${total}` },
        });
      }
      const chunk = bytes.slice(start, end + 1);
      return new Response(chunk, {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(chunk.byteLength),
        },
      });
    }

    return new Response(bytes, {
      status: 200,
      headers: { ...headers, "Content-Length": String(total) },
    });
  },
);
