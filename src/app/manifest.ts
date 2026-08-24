import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";

// /manifest.webmanifest — PWA + marka sinyali (ad, tema rengi, ikon).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dijital Kafe — QR Menü, AI Fotoğraf ve Adisyon",
    short_name: APP_NAME,
    description:
      "Restoran ve kafeler için QR menü, 150 hazır tema, AI fotoğraf canlandırma ve dijital adisyon (hafif POS).",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF6B35",
    lang: "tr",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
