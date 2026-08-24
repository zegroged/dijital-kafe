import { createHash, randomBytes } from "node:crypto";
import { ROOT_DOMAIN } from "@/lib/constants";
import { integrations } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { renderEmail } from "@/lib/mail/template";
import { prisma } from "@/lib/prisma";

// E-posta doğrulama jetonu üretir, kaydeder ve doğrulama maili gönderir.
// Ham jeton yalnız mailde; DB'de SHA-256 özeti tutulur (PasswordResetToken deseni).
// SMTP yapılandırılmamışsa hiçbir jeton üretmeden false döner — çağıran taraf bu
// durumda kullanıcıyı otomatik doğrulamış sayabilir (yerel/geliştirme).

const TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

export async function sendEmailVerification(opts: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<boolean> {
  if (!integrations.smtp()) return false;

  // Kullanıcının bekleyen eski jetonlarını geçersiz kıl (tek aktif link).
  await prisma.emailVerificationToken.updateMany({
    where: { userId: opts.userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const raw = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  await prisma.emailVerificationToken.create({
    data: {
      userId: opts.userId,
      tokenHash,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });

  const link = `https://${ROOT_DOMAIN}/eposta-dogrula?token=${raw}`;
  const hi = opts.name ? `Merhaba ${opts.name},` : "Merhaba,";
  const { html, text } = renderEmail({
    heading: "E-posta adresini doğrula",
    bodyLines: [
      hi,
      "Komisyoncu hesabını etkinleştirmek için e-posta adresini doğrulaman gerekiyor. Aşağıdaki butona tıkla.",
      "Doğruladıktan sonra referans kodun aktifleşir ve müşterilerin kayıt olurken kullanmaya başlayabilir.",
    ],
    ctaText: "E-postamı doğrula",
    ctaUrl: link,
    footnote: "Bu bağlantı 24 saat geçerlidir. Doğrulamadan referans kodun aktif olmaz.",
  });
  await sendMail({
    to: opts.email,
    subject: "Dijital Kafe — E-posta adresini doğrula",
    html,
    text,
  });
  return true;
}
