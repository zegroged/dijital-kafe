import type { PaymentProvider } from "./provider";
import type { CheckoutInput, CheckoutResult, VerifyResult } from "./types";

// İyzico alınmadan tüm ödeme akışını (paket yükseltme, QR sipariş, komisyon)
// uçtan uca test etmek için: ödeme ANINDA başarılı sayılır. Gerçek para yok.
// PAYMENT_PROVIDER=mock ile devreye girer.
export class MockPaymentProvider implements PaymentProvider {
  isConfigured(): boolean {
    return true;
  }
  async createCheckout(_input: CheckoutInput): Promise<CheckoutResult> {
    return { paid: true };
  }
  async verify(token: string): Promise<VerifyResult> {
    return { paid: true, token };
  }
}
