import { ImageResponse } from "next/og";

// Markalı OG/Twitter paylaşım görseli (1200x630). Next bu dosyayı otomatik
// olarak og:image + twitter:image olarak ekler. Harici font yüklenmediği için
// üst şeritte diakritiksiz büyük harf kullanılır (eksik glyph kutusu olmasın).

export const alt = "Dijital Kafe — Restoran ve Kafeler için QR Menü";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #FF6B35 0%, #F4A300 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Özellik şeridi (diakritiksiz, büyük harf) */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {["QR MENU", "150 TEMA", "AI FOTOGRAF", "ADISYON"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Marka */}
        <div style={{ display: "flex", fontSize: 132, fontWeight: 800, letterSpacing: -3 }}>
          Dijital Kafe
        </div>

        {/* Adres */}
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, opacity: 0.92 }}>
          dijitalkafe.com
        </div>
      </div>
    ),
    { ...size },
  );
}
