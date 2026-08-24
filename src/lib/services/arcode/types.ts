// AR Code (3D/AR) entegrasyonu için domain tipleri.
// Uygulamanın geri kalanı SADECE bu tiplere bağlıdır; gerçek AR Code API'sinin
// alan adları "live" provider'ın içinde izole edilir.

export type ScanStatus = "pending" | "processing" | "ready" | "failed";

// Hazır bir 3D varlığı: platforma göre model-viewer otomatik seçer.
export interface ModelAsset {
  glbUrl: string; // Android / web (Scene Viewer)
  usdzUrl?: string; // iOS (Quick Look) — yoksa iPhone'da AR açılmaz
  posterUrl?: string; // yüklenmeden önce gösterilecek görsel
}

export interface ScanJob {
  assetId: string; // AR Code tarafındaki referans (dishes.ar_code_asset_id)
  status: ScanStatus;
  asset?: ModelAsset; // status === "ready" iken dolu
  error?: string; // status === "failed" iken dolu
}

// Bir tarama/oluşturma işini başlatmak için girdi.
// AR Code akışında genelde kullanıcı kendi telefonuyla tarar; biz işi
// referanslayıp sonucu (glb/usdz) çekeriz.
export interface CreateScanInput {
  dishId: string;
  // Object Capture için kaynak (foto seti veya yüklenen video/dosya URL'i).
  imageUrls?: string[];
  sourceFileUrl?: string;
  // İsim/etiketleme için
  label?: string;
}

export class ArCodeNotConfiguredError extends Error {
  constructor() {
    super("AR Code entegrasyonu yapılandırılmamış (ARCODE_PROVIDER=stub).");
    this.name = "ArCodeNotConfiguredError";
  }
}
