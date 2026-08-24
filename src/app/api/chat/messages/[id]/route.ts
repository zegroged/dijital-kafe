import { apiHandler } from "@/lib/auth/guard";
import { getChatUser } from "@/lib/chat/access";
import { publishChat } from "@/lib/chat/bus";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// DELETE /api/chat/messages/:id → kendi mesajını sil (yumuşak silme).
// İçerik ve ses verisi kalıcı olarak temizlenir; kabarcık "silindi" görünür.
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const me = await getChatUser();
    if (!me) return fail("Bulunamadı", 404);
    const { id } = await ctx.params;

    // Metadata temizliği + ses silme TEK transaction'da: arada bağlantı kopar
    // veya container yeniden başlarsa mesaj "silindi" görünüp ham ses baytları
    // tabloda kalmasın.
    const done = await prisma.$transaction(async (tx) => {
      // Sadece KENDİ mesajı (senderId guard'ı IDOR'u kapatır).
      const upd = await tx.chatMessage.updateMany({
        where: { id, senderId: me.id, deletedAt: null },
        data: {
          deletedAt: new Date(),
          body: null,
          audioMime: null,
          audioSize: null,
          durationMs: null,
        },
      });
      if (upd.count !== 1) return false;
      await tx.chatAudio.deleteMany({ where: { messageId: id } });
      return true;
    });
    if (!done) return fail("Mesaj bulunamadı", 404);

    // Karşı tarafta da anında "silindi"ye dönsün.
    publishChat({ kind: "delete", id });

    return ok({ ok: true });
  },
);
