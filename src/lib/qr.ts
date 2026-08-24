import QRCode from "qrcode";
import { ROOT_DOMAIN } from "@/lib/constants";

// Bir restoranın public menü URL'i.
export function publicMenuUrl(slug: string): string {
  const isLocal = ROOT_DOMAIN.startsWith("localhost");
  const proto = isLocal ? "http" : "https";
  return `${proto}://${slug}.${ROOT_DOMAIN}`;
}

export function qrPngDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export function qrSvgString(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
