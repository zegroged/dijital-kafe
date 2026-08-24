import type { ArCodeProvider } from "./provider";
import { ArCodeNotConfiguredError, type CreateScanInput } from "./types";

// Varsayılan sağlayıcı: AR Code henüz alınmadı.
// UI "3D Ekle" butonunu gizler; bir şey çağrılırsa net hata verir.
export class StubArCodeProvider implements ArCodeProvider {
  isConfigured(): boolean {
    return false;
  }

  async createScan(_input: CreateScanInput): Promise<never> {
    throw new ArCodeNotConfiguredError();
  }

  async getScan(_assetId: string): Promise<never> {
    throw new ArCodeNotConfiguredError();
  }

  verifyWebhook(_rawBody: string, _signature: string | null): boolean {
    return false;
  }
}
