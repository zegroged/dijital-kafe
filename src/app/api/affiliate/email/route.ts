import { apiHandler, requireAffiliateContext } from "@/lib/auth/guard";
import { sendEmailVerification } from "@/lib/auth/email-verify";
import { integrations } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ email: emailSchema });

// POST /api/affiliate/email { email } → komisyoncu KENDİ panelinden e-postasını
// ayarlar ve doğrulama mailini tetikler. Onaylanınca (emailVerified dolunca)
// referans kodu aktifleşir. (Hesap açılışında e-posta alınmaz.)
export const POST = apiHandler(async (req) => {
  const { userId } = await requireAffiliateContext();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Geçerli bir e-posta girin");
  }
  const { email } = parsed.data;

  const rl = await rateLimit(`aff-email:${userId}`, 5, 900); // 15 dk'da 5
  if (!rl.ok) return fail("Çok fazla deneme. Biraz sonra tekrar dene.", 429);

  // E-posta başka bir hesapta kullanılıyorsa engelle (kendi e-postası serbest).
  const taken = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (taken && taken.id !== userId) {
    return fail("Bu e-posta başka bir hesapta kullanılıyor", 409);
  }

  // SMTP varsa: e-postayı ayarla (onaysız) + doğrulama maili gönder.
  // SMTP yoksa (yerel/geliştirme): otomatik onayla ki akış kilitlenmesin.
  const smtp = integrations.smtp();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { email, emailVerified: smtp ? null : new Date() },
    select: { name: true },
  });

  let sent = false;
  if (smtp) {
    try {
      sent = await sendEmailVerification({ userId, email, name: updated.name });
    } catch (e) {
      console.error("[aff-email] doğrulama maili gönderilemedi:", e);
    }
  }

  return ok({ ok: true, sent, verified: !smtp });
});
