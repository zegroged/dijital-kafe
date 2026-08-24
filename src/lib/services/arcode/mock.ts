import type { ArCodeProvider } from "./provider";
import type { CreateScanInput, ScanJob } from "./types";

// AR Code alınmadan 3D/AR arayüzünü (modal, "3D'de Gör", iOS/Android AR)
// uçtan uca geliştirip test edebilmek için örnek modeller döndüren sağlayıcı.
// ARCODE_PROVIDER=mock ile devreye girer.
//
// Örnek varlıklar model-viewer'ın herkese açık demo dosyalarıdır
// (hem .glb hem .usdz mevcut → iOS + Android AR birlikte test edilir).
const SAMPLE_GLB =
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
const SAMPLE_USDZ =
  "https://modelviewer.dev/shared-assets/models/Astronaut.usdz";
const SAMPLE_POSTER =
  "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Astronaut/glTF/Astronaut.jpg";

export class MockArCodeProvider implements ArCodeProvider {
  isConfigured(): boolean {
    return true;
  }

  // İşi başlatır gibi yapar: önce "processing" döner (polling yolunu test eder).
  async createScan(input: CreateScanInput): Promise<ScanJob> {
    return {
      assetId: `mock_${input.dishId}`,
      status: "processing",
    };
  }

  // Sonraki çağrıda hazır örnek modeli verir.
  async getScan(assetId: string): Promise<ScanJob> {
    return {
      assetId,
      status: "ready",
      asset: {
        glbUrl: SAMPLE_GLB,
        usdzUrl: SAMPLE_USDZ,
        posterUrl: SAMPLE_POSTER,
      },
    };
  }

  // Mock'ta imza doğrulaması yok.
  verifyWebhook(_rawBody: string, _signature: string | null): boolean {
    return true;
  }
}
