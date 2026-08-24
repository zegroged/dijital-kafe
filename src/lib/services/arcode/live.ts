import { createHmac, timingSafeEqual } from "node:crypto";
import type { ArCodeProvider } from "./provider";
import type { CreateScanInput, ScanJob, ScanStatus } from "./types";

// ============================================================================
//  GERÇEK AR CODE ENTEGRASYONU — "2 dakikalık iş" buraya gelecek.
//
//  AR Code STANDARD planı alınınca yapılacaklar (Aşama 0 spike sonrası):
//   1. .env: ARCODE_PROVIDER=live, ARCODE_API_KEY=..., ARCODE_API_BASE=...,
//      ARCODE_WEBHOOK_SECRET=...
//   2. Aşağıdaki 3 TODO bloğunu AR Code API dokümanına göre doldur:
//        - createScan: iş başlatma endpoint'i + gövde
//        - getScan:    durum sorgulama endpoint'i + yanıt eşleme
//        - mapStatus:  AR Code durum adlarını bizim ScanStatus'a çevir
//   Geri kalan her şey (DB, UI, modal, kota, polling) zaten hazır.
// ============================================================================

interface LiveConfig {
  apiKey: string;
  apiBase: string; // örn. https://arcode.com/api  (spike'ta netleşecek)
  webhookSecret?: string;
}

export class LiveArCodeProvider implements ArCodeProvider {
  constructor(private readonly cfg: LiveConfig) {}

  isConfigured(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.apiBase);
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.cfg.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  // AR Code durum adlarını bizim normalize ettiğimiz duruma çevirir.
  private mapStatus(raw: string): ScanStatus {
    // TODO(arcode): gerçek durum adlarıyla eşle
    switch (raw) {
      case "queued":
      case "pending":
        return "pending";
      case "processing":
      case "running":
        return "processing";
      case "completed":
      case "done":
      case "ready":
        return "ready";
      default:
        return "failed";
    }
  }

  async createScan(input: CreateScanInput): Promise<ScanJob> {
    // TODO(arcode): doğru endpoint + gövde. Örnek iskelet:
    const res = await fetch(`${this.cfg.apiBase}/captures`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        label: input.label,
        images: input.imageUrls,
        source: input.sourceFileUrl,
      }),
    });
    if (!res.ok) {
      throw new Error(`AR Code createScan başarısız: ${res.status}`);
    }
    const data = (await res.json()) as { id: string; status: string };
    return { assetId: data.id, status: this.mapStatus(data.status) };
  }

  async getScan(assetId: string): Promise<ScanJob> {
    // TODO(arcode): doğru endpoint + yanıt alanları (glb/usdz URL'leri).
    const res = await fetch(`${this.cfg.apiBase}/captures/${assetId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`AR Code getScan başarısız: ${res.status}`);
    }
    const data = (await res.json()) as {
      id: string;
      status: string;
      glb_url?: string;
      usdz_url?: string;
      poster_url?: string;
      error?: string;
    };
    const status = this.mapStatus(data.status);
    return {
      assetId: data.id,
      status,
      asset:
        status === "ready" && data.glb_url
          ? {
              glbUrl: data.glb_url,
              usdzUrl: data.usdz_url,
              posterUrl: data.poster_url,
            }
          : undefined,
      error: status === "failed" ? (data.error ?? "Bilinmeyen hata") : undefined,
    };
  }

  // Webhook imzası (HMAC-SHA256). AR Code imza başlığını gönderiyorsa kullanılır.
  verifyWebhook(rawBody: string, signature: string | null): boolean {
    if (!this.cfg.webhookSecret || !signature) return false;
    const expected = createHmac("sha256", this.cfg.webhookSecret)
      .update(rawBody)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
