import type { CheckoutInput, CheckoutResult, VerifyResult } from "./types";

// Tüm ödeme sağlayıcılarının (stub / mock / live) uyguladığı arayüz.
export interface PaymentProvider {
  isConfigured(): boolean;
  // Ödeme başlat. mock → anında paid:true; live → checkoutUrl döner.
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  // İyzico dönüşünde token doğrula (live). mock'ta her zaman paid:true.
  verify(token: string): Promise<VerifyResult>;
}
