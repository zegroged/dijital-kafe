import type { PaymentProvider } from "./provider";
import { type CheckoutInput, PaymentNotConfiguredError } from "./types";

// Varsayılan: ödeme yok. UI "öde" butonunu gizler/uyarır.
export class StubPaymentProvider implements PaymentProvider {
  isConfigured(): boolean {
    return false;
  }
  async createCheckout(_input: CheckoutInput): Promise<never> {
    throw new PaymentNotConfiguredError();
  }
  async verify(_token: string): Promise<never> {
    throw new PaymentNotConfiguredError();
  }
}
