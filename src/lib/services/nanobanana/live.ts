import type { ImageEnhanceProvider } from "./provider";
import { COLOR_ENHANCE_PROMPT, type EnhanceInput, type EnhanceResult } from "./types";

// ============================================================================
//  GERÇEK NANO BANANA (Google Gemini görsel modeli) ENTEGRASYONU.
//  "2 dakikalık iş" buraya gelecek — API key alınınca:
//
//   1. .env: NANOBANANA_PROVIDER=live, NANOBANANA_API_KEY=...,
//      (opsiyonel) NANOBANANA_MODEL=gemini-2.5-flash-image
//   2. Aşağıdaki TODO bloklarını Gemini API dokümanına göre doğrula:
//        - İSTEK: generateContent gövdesi + (gerekiyorsa) responseModalities
//        - YANIT: görsel part'ının yolu (candidates[].content.parts[].inlineData)
//   Geri kalan her şey (yükleme, önce/sonra UI, onay, depolama, yayın) hazır.
//
//  Spike notu: çıktı baytlarını gerçekten ALDIĞIMIZI ve içeriğin korunup yalnız
//  renklerin canlandığını doğrula (örnek 2-3 yemek fotoğrafıyla).
// ============================================================================

interface LiveConfig {
  apiKey: string;
  model: string; // örn. "gemini-2.5-flash-image" (nano banana)
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  // Gemini bazı sürümlerde camelCase yerine snake_case döndürür:
  inline_data?: { mime_type?: string; data?: string };
}

export class LiveImageEnhanceProvider implements ImageEnhanceProvider {
  constructor(private readonly cfg: LiveConfig) {}

  isConfigured(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.model);
  }

  async enhance({ bytes, mimeType }: EnhanceInput): Promise<EnhanceResult> {
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(this.cfg.model)}:generateContent`;

    // gemini-2.5-flash-image yalnızca görsel döndürmek için responseModalities
    // = ["IMAGE"] ister (doğrulandı: Gemini image-generation dokümanı). Bu
    // olmadan model görsel üretmez / metin döndürür.
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.cfg.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: COLOR_ENHANCE_PROMPT },
              { inlineData: { mimeType, data: bytes.toString("base64") } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Nano Banana canlandırma başarısız: ${res.status} ${detail}`.trim(),
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: GeminiPart[] } }[];
    };

    // TODO(nanobanana): YANIT şemasını modele göre doğrula. Tipik yol:
    //   candidates[0].content.parts[].inlineData.{mimeType,data(base64)}
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const p of parts) {
      const inline = (p.inlineData ?? p.inline_data) as
        | { mimeType?: string; mime_type?: string; data?: string }
        | undefined;
      const b64 = inline?.data;
      if (b64) {
        return {
          bytes: Buffer.from(b64, "base64"),
          mimeType: inline?.mimeType ?? inline?.mime_type ?? "image/png",
        };
      }
    }

    throw new Error("Nano Banana yanıtında görsel bulunamadı.");
  }
}
