import type { PayoutInput, PayoutResult } from "./types";

// Tüm payout sağlayıcılarının uyduğu arayüz (ödeme seam'iyle aynı desen).
export interface PayoutProvider {
  isConfigured(): boolean;
  sendPayout(input: PayoutInput): Promise<PayoutResult>;
}
