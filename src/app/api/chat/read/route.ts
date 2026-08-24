import { apiHandler } from "@/lib/auth/guard";
import { getChatUser } from "@/lib/chat/access";
import { markPartnerMessagesRead } from "@/lib/chat/message";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";

// POST /api/chat/read → sohbet ekranda açıkken karşı tarafın mesajlarını
// okundu yapar; gönderen anında ✓✓ görür.
export const POST = apiHandler(async () => {
  const me = await getChatUser();
  if (!me) return fail("Bulunamadı", 404);
  const count = await markPartnerMessagesRead(me.id);
  return ok({ ok: true, count });
});
