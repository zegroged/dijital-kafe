import { ROOT_DOMAIN } from "@/lib/constants";

// Markalı, e-posta-güvenli HTML şablonu (tablo tabanlı + inline stil; Gmail/
// Outlook/Apple Mail uyumlu). Tüm uygulama mailleri bunu kullanır.

const ORANGE = "#FF6B35";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface EmailContent {
  heading: string;
  // Gövde paragrafları (düz metin; HTML olarak da güvenli gömülür).
  bodyLines: string[];
  ctaText: string;
  ctaUrl: string;
  footnote?: string;
}

export function renderEmail(opts: EmailContent): { html: string; text: string } {
  const { heading, bodyLines, ctaText, ctaUrl, footnote } = opts;
  const site = `https://${ROOT_DOMAIN}`;

  const bodyHtml = bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3f3f46;">${l}</p>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${heading} · Dijital Kafe</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:28px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;font-family:${FONT};">
        <tr><td style="background:${ORANGE};padding:24px 32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;">☕ Dijital Kafe</span>
        </td></tr>
        <tr><td style="padding:34px 32px 6px;">
          <h1 style="margin:0 0 16px;font-size:21px;font-weight:700;color:#1c1917;">${heading}</h1>
          ${bodyHtml}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 22px;">
            <tr><td align="center" bgcolor="${ORANGE}" style="border-radius:10px;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${ctaText}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 4px;font-size:12.5px;line-height:1.6;color:#78716c;">Buton çalışmazsa bu bağlantıyı tarayıcına yapıştır:</p>
          <p style="margin:0 0 18px;font-size:12.5px;line-height:1.5;"><a href="${ctaUrl}" target="_blank" style="color:#c2410c;word-break:break-all;">${ctaUrl}</a></p>
          ${footnote ? `<p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a29e;">${footnote}</p>` : ""}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafaf9;border-top:1px solid #e7e5e4;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#a8a29e;">
            Bu e-posta <a href="${site}" target="_blank" style="color:#a8a29e;text-decoration:underline;">Dijital Kafe</a> tarafından gönderildi.<br>
            Bu isteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#a8a29e;font-family:${FONT};">© Dijital Kafe · ${ROOT_DOMAIN}</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text =
    `${heading}\n\n` +
    `${bodyLines.join("\n\n")}\n\n` +
    `${ctaText}: ${ctaUrl}\n\n` +
    (footnote ? `${footnote}\n\n` : "") +
    `— Dijital Kafe · ${site}`;

  return { html, text };
}
