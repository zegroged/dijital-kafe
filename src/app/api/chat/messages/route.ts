import { apiHandler } from "@/lib/auth/guard";
import { chatMemberIds, getChatUser } from "@/lib/chat/access";
import { publishChat } from "@/lib/chat/bus";
import {
  MESSAGE_SELECT,
  markPartnerMessagesRead,
  serializeMessage,
} from "@/lib/chat/message";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 100; // ilk yüklemede getirilecek mesaj sayısı
const DELTA_LIMIT = 300; // mutabakat turunda tek seferde en fazla satır
// Bir yazının damgalanması ile commit'inin görünür olması arasındaki pencerede
// çalışan sorgu o satırı GÖREMEZ. İmleci biraz geriye alarak sonraki turda
// yakalanmasını garantiler (fazladan gelen satırları istemci zaten tekilleştirir).
const CURSOR_SKEW_MS = 5_000;

const sendSchema = z.object({
  body: z.string().trim().min(1, "Mesaj boş olamaz").max(4000, "Mesaj çok uzun"),
});

// GET /api/chat/messages?since=<ISO>
// Anlık iletim SSE (/api/chat/stream) ile yapılır; bu uç ilk yükleme ve
// periyodik "mutabakat" (kaçan olay varsa yakala) içindir.
export const GET = apiHandler(async (req: Request) => {
  const me = await getChatUser();
  if (!me) return fail("Bulunamadı", 404);

  const memberIds = await chatMemberIds();
  const url = new URL(req.url);
  const sinceRaw = url.searchParams.get("since");
  const parsedSince = sinceRaw ? new Date(sinceRaw) : null;
  const since =
    parsedSince && !Number.isNaN(parsedSince.getTime()) ? parsedSince : null;

  await markPartnerMessagesRead(me.id);

  const now = new Date();
  let cursor = new Date(now.getTime() - CURSOR_SKEW_MS);
  let rows;

  if (since) {
    // Tek alanla (updatedAt) sayfalanır → kırpılan satır imlecin gerisinde
    // kalıp kaybolmaz.
    rows = await prisma.chatMessage.findMany({
      where: { senderId: { in: memberIds }, updatedAt: { gt: since } },
      select: MESSAGE_SELECT,
      orderBy: { updatedAt: "asc" },
      take: DELTA_LIMIT,
    });
    if (rows.length === DELTA_LIMIT) {
      // Kırpıldı: imleci son GÖNDERİLEN satıra sabitle, "now"a atlatma —
      // aksi halde arada kalan satırlar bir daha hiç sorguya düşmez.
      cursor = rows[rows.length - 1].updatedAt;
    }
  } else {
    rows = (
      await prisma.chatMessage.findMany({
        where: { senderId: { in: memberIds } },
        select: MESSAGE_SELECT,
        orderBy: { createdAt: "desc" },
        take: INITIAL_LIMIT,
      })
    ).reverse();
  }

  const res = ok({
    ok: true,
    now: cursor.toISOString(),
    // İstemci bunu sayfanın render edildiği kimlikle karşılaştırır: aynı
    // tarayıcıda diğer hesapla giriş yapılırsa (çerez tek) sayfa kendini
    // yeniler — aksi halde mesajlar yanlış tarafta görünür.
    meId: me.id,
    messages: rows.map((m) => serializeMessage(m, me.id)),
  });
  // Gizli içerik: ara sunucu/CDN/tarayıcı önbelleğe almasın.
  res.headers.set("Cache-Control", "private, no-store, max-age=0");
  res.headers.set("Vary", "Cookie");
  return res;
});

// POST /api/chat/messages { body } → metin mesajı gönder
export const POST = apiHandler(async (req: Request) => {
  const me = await getChatUser();
  if (!me) return fail("Bulunamadı", 404);

  const rl = await rateLimit(`chat:${me.id}`, 120, 60); // dakikada 120 mesaj
  if (!rl.ok) return fail("Çok hızlı yazıyorsun, biraz yavaşla.", 429);

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçersiz mesaj");
  }

  const msg = await prisma.chatMessage.create({
    data: { senderId: me.id, kind: "text", body: parsed.data.body },
    select: MESSAGE_SELECT,
  });

  // Karşı tarafa ANINDA ilet.
  publishChat({ kind: "message", row: msg });

  return ok({ ok: true, message: serializeMessage(msg, me.id) }, 201);
});
