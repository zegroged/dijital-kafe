import { themeToCssVars, googleFontsHref } from "@/lib/theme/css";
import type { ThemeSettings } from "@/lib/theme/schema";

// Menü görüntülenemediğinde (trial/abonelik bitti veya yayında değil)
// işletmenin temasıyla uyumlu, sade bir bilgilendirme ekranı.

type Props = {
  theme: ThemeSettings;
  businessName: string;
  logoUrl: string | null;
  title: string;
  detail: string;
};

export function MenuClosed({
  theme,
  businessName,
  logoUrl,
  title,
  detail,
}: Props) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsHref(theme)} />
      <main
        style={{
          ...themeToCssVars(theme),
          background: "var(--menu-bg-css)",
          color: "var(--menu-text)",
          fontFamily: "var(--menu-font-body)",
        }}
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={businessName}
            loading="lazy"
            className="h-20 w-20 rounded-full object-cover shadow-[var(--menu-shadow-card)]"
          />
        ) : null}
        <h1
          className="text-balance font-semibold"
          style={{
            fontFamily: "var(--menu-font-heading)",
            fontSize: "var(--menu-size-heading)",
            color: "var(--menu-primary)",
          }}
        >
          {businessName}
        </h1>
        <p
          className="text-lg font-medium"
          style={{ color: "var(--menu-text)" }}
        >
          {title}
        </p>
        <p
          className="max-w-sm text-balance text-sm opacity-70"
          style={{ fontSize: "var(--menu-size-body)" }}
        >
          {detail}
        </p>
      </main>
    </>
  );
}
