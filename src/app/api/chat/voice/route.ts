import { apiHandler } from "@/lib/auth/guard";
import { getChatUser } from "@/lib/chat/access";
import { publishChat } from "@/lib/chat/bus";
import { MESSAGE_SELECT, serializeMessage } from "@/lib/chat/message";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 6 * 1024 * 1024; // ~6MB (2 dk opus fazlasıyla sığar)
const MAX_DURATION_MS = 5 * 60 * 1000;

// Tarayıcıya göre değişir: Chrome/Firefox webm-opus, iOS Safari mp4-aac.
const ALLOWED = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/x-m4a",
]);

// "audio/webm;codecs=opus" → "audio/webm"
function baseMime(t: string): string {
  return t.split(";")[0].trim().toLowerCase();
}

// POST /api/chat/voice (multipart: file, durationMs?) → sesli mesaj oluştur
export const POST = apiHandler(async (req: Request) => {
  const me = await getChatUser();
  if (!me) return fail("Bulunamadı", 404);

  const rl = await rateLimit(`chat-voice:${me.id}`, 40, 300); // 5 dk'da 40 ses
  if (!rl.ok) return fail("Çok fazla ses kaydı, biraz bekle.", 429);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Ses dosyası gerekli");

  const mime = baseMime(file.type || "");
  if (!ALLOWED.has(mime)) return fail("Desteklenmeyen ses biçimi");
  if (file.size === 0) return fail("Boş kayıt");
  if (file.size > MAX_BYTES) return fail("Kayıt çok uzun (en fazla ~6MB)");

  const durRaw = Number(form.get("durationMs"));
  const durationMs =
    Number.isFinite(durRaw) && durRaw > 0
      ? Math.min(Math.round(durRaw), MAX_DURATION_MS)
      : null;

  const data = Buffer.from(await file.arrayBuffer());

  // Mesaj + ses tek transaction'da (yarım kayıt kalmasın).
  const msg = await prisma.chatMessage.create({
    data: {
      senderId: me.id,
      kind: "voice",
      audioMime: mime,
      audioSize: data.byteLength,
      durationMs,
      audio: { create: { data } },
    },
    select: MESSAGE_SELECT,
  });

  // Karşı tarafa ANINDA ilet.
  publishChat({ kind: "message", row: msg });

  return ok({ ok: true, message: serializeMessage(msg, me.id) }, 201);
});
