import nodemailer from "nodemailer";
import { env, integrations } from "@/lib/env";

// SMTP (Google Workspace vb.) ile mail gönderimi. Yapılandırılmamışsa sessizce
// atlar (geliştirmede patlamaz). Şifre sıfırlama maili buradan gider.

let transporter: nodemailer.Transporter | undefined;

function getTransport() {
  if (transporter) return transporter;
  const port = env.SMTP_PORT ?? 587;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465, // 465 SSL, 587 STARTTLS
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Maili gönderir. SMTP yoksa false döner (çağıran taraf akışı bozmaz).
export async function sendMail(input: MailInput): Promise<boolean> {
  if (!integrations.smtp()) {
    console.warn("[mail] SMTP yapılandırılmamış, mail atlandı:", input.subject);
    return false;
  }
  await getTransport().sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  return true;
}
