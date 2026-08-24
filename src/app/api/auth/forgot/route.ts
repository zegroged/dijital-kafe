import { createHash, randomBytes } from "node:crypto";
import { apiHandler } from "@/lib/auth/guard";
import { ROOT_DOMAIN } from "@/lib/constants";
import { ok } from "@/lib/http";
import { sendMail } from "@/lib/mail";
import { renderEmail } from "@/lib/mail/template";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ email: emailSchema });
const TTL_MS = 60 * 60 * 1000; // 1 saat

// POST /api/auth/forgot { email } → sıfırlama linki maille gönder.
// Güvenlik: e-posta sistemde olsa da olmasa da AYNI yanıt (enumerasyon engeli).
export const POST = apiHandler(async (req) => {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ok({ ok: true });
  const email = parsed.data.email;

  const rl = await rateLimit(`forgot:${email}`, 5, 900); // 15 dk'da 5
  if (!rl.ok) return ok({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (user) {
    const raw = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    const link = `https://${ROOT_DOMAIN}/sifre-sifirla?token=${raw}`;
    const { html, text } = renderEmail({
      heading: "Şifre sıfırlama",
      bodyLines: [
        "Hesabının şifresini sıfırlamak için bir istek aldık. Yeni şifreni belirlemek için aşağıdaki butona tıkla.",
      ],
      ctaText: "Şifremi sıfırla",
      ctaUrl: link,
      footnote:
        "Bu bağlantı 1 saat geçerlidir. Bu isteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.",
    });
    try {
      await sendMail({
        to: email,
        subject: "Dijital Kafe — Şifre sıfırlama",
        html,
        text,
      });
    } catch (e) {
      console.error("[forgot] mail gönderilemedi:", e);
    }
  }

  return ok({ ok: true });
});
