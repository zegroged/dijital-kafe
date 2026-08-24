import type { CreateScanInput, ScanJob } from "./types";

// Tüm AR Code sağlayıcılarının (stub / mock / live) uyguladığı arayüz.
// Uygulama kodu yalnızca bu arayüzü görür.
export interface ArCodeProvider {
  // Entegrasyon kullanıma hazır mı? (UI'da "3D Ekle" butonunu buna göre göster)
  isConfigured(): boolean;

  // Yeni bir 3D oluşturma/tarama işi başlat. Genelde status="pending" döner.
  createScan(input: CreateScanInput): Promise<ScanJob>;

  // Bir işin güncel durumunu çek (polling). status="ready" ise asset dolu gelir.
  getScan(assetId: string): Promise<ScanJob>;

  // Webhook imza doğrulaması (live'da gerçek, diğerlerinde true/false).
  verifyWebhook(rawBody: string, signature: string | null): boolean;
}
