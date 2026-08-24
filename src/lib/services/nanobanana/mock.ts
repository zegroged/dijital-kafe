import sharp from "sharp";
import type { ImageEnhanceProvider } from "./provider";
import type { EnhanceInput, EnhanceResult } from "./types";

// Nano Banana API'si alınmadan tüm akışı (buton → önce/sonra → onay → yayın)
// uçtan uca geliştirip test edebilmek için GERÇEK bir çıktı üreten sağlayıcı.
// NANOBANANA_PROVIDER=mock ile devreye girer.
//
// Yapay zeka DEĞİL — sharp ile içeriği bozmadan renk/doygunluk/ışık artırır.
// Böylece önce/sonra farkı görünür ve akış doğrulanabilir. Gerçek "renkleri
// canlandır, içeriği değiştirme" davranışını live (Gemini) sağlayacaktır.
export class MockImageEnhanceProvider implements ImageEnhanceProvider {
  isConfigured(): boolean {
    return true;
  }

  async enhance({ bytes }: EnhanceInput): Promise<EnhanceResult> {
    const out = await sharp(bytes)
      .rotate()
      .modulate({ saturation: 1.4, brightness: 1.06 }) // canlı renk + hafif aydınlatma
      .linear(1.08, -8) // kontrastı bir miktar artır
      .sharpen()
      .toFormat("webp", { quality: 92 })
      .toBuffer();
    return { bytes: out, mimeType: "image/webp" };
  }
}
