import type { ImageEnhanceProvider } from "./provider";
import { type EnhanceInput, ImageEnhanceNotConfiguredError } from "./types";

// Varsayılan sağlayıcı: Nano Banana henüz alınmadı.
// UI "AI ile Canlandır" butonunu gizler; bir şey çağrılırsa net hata verir.
export class StubImageEnhanceProvider implements ImageEnhanceProvider {
  isConfigured(): boolean {
    return false;
  }

  async enhance(_input: EnhanceInput): Promise<never> {
    throw new ImageEnhanceNotConfiguredError();
  }
}
