import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { getChatPartner, getChatUser } from "@/lib/chat/access";
import { prisma } from "@/lib/prisma";

// Özel sohbet. env CHAT_MEMBER_IDS'teki 2 kişi dışında HERKESE 404 —
// özelliğin varlığı bile sızmasın diye 403 değil 404 (notFound).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sohbet",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ChatPage() {
  const me = await getChatUser();
  if (!me) notFound();

  const [partner, restaurant] = await Promise.all([
    getChatPartner(me.id),
    prisma.restaurant.findUnique({
      where: { userId: me.id },
      select: { id: true },
    }),
  ]);

  // "Geri" → menüler. İşletmesi olan panele, olmayan ana sayfaya döner.
  const backHref = restaurant ? "/panel/menu" : "/";

  return (
    <ChatRoom
      partnerName={partner?.name ?? "Sohbet"}
      meName={me.name ?? me.username ?? "Sen"}
      meId={me.id}
      backHref={backHref}
    />
  );
}
