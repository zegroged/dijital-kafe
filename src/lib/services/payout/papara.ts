import type { PayoutProvider } from "./provider";
import type { PayoutInput, PayoutResult } from "./types";

// ============================================================================
//  PAPARA BUSINESS — toplu/tekil IBAN ödemesi (mass payment).
//  Anahtar alınınca yapılacaklar:
//   1. .env: PAYOUT_PROVIDER=papara, PAPARA_API_KEY, PAPARA_API_BASE
//      (örn. https://merchant-api.papara.com)
//   2. Aşağıdaki TODO'ları Papara güncel dokümanıyla doğrula (endpoint, header,
//      gövde alan adları, yanıt yolu, anlık mı asenkron mu).
//   Geri kalan her şey (bakiye, talep, stopaj, onay, UI) hazır.
// ============================================================================

interface PaparaConfig {
  apiKey: string;
  baseUrl: string;
}

// TODO(papara): gerçek endpoint'i doğrula.
const PAYOUT_PATH = "/masspayment/iban";

export class PaparaPayoutProvider implements PayoutProvider {
  constructor(private readonly cfg: PaparaConfig) {}

  isConfigured(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.baseUrl);
  }

  async sendPayout(input: PayoutInput): Promise<PayoutResult> {
    // TODO(papara): header adı (ApiKey) + gövde alanları doğrulanacak.
    const res = await fetch(`${this.cfg.baseUrl}${PAYOUT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ApiKey: this.cfg.apiKey,
      },
      body: JSON.stringify({
        iban: input.iban,
        name: input.holder,
        amount: input.amount,
        currency: "TRY",
        description: input.description ?? "",
        // İdempotensi/eşleştirme için kendi referansımız:
        massPaymentId: input.withdrawalId,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Papara ödeme hatası: ${res.status} ${detail}`.trim());
    }

    const data = (await res.json().catch(() => ({}))) as {
      data?: { id?: string } | string;
      result?: boolean;
    };
    // TODO(papara): başarı koşulu + referans yolu doğrulanacak. Papara IBAN
    // ödemeleri tipik olarak ANINDA gerçekleşir → paid:true.
    const ref =
      typeof data.data === "string"
        ? data.data
        : (data.data?.id ?? `papara:${input.withdrawalId.slice(0, 8)}`);
    return { paid: true, ref };
  }
}
