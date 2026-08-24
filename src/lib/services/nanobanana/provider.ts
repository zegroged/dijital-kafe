import type { EnhanceInput, EnhanceResult } from "./types";

// Tüm görsel-canlandırma sağlayıcılarının (stub / mock / live) uyguladığı arayüz.
// Uygulama kodu yalnızca bu arayüzü görür.
export interface ImageEnhanceProvider {
  // Entegrasyon kullanıma hazır mı? (UI'da "AI ile Canlandır" butonunu buna göre göster)
  isConfigured(): boolean;

  // Görseli sabit prompt ile canlandır. Senkron (Gemini görsel ~birkaç saniye).
  enhance(input: EnhanceInput): Promise<EnhanceResult>;
}
