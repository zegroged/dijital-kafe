import type { PayoutProvider } from "./provider";
import type { PayoutInput, PayoutResult } from "./types";

// Test modu: ödeme anında başarılı sayılır (gerçek para hareketi yok).
export class MockPayoutProvider implements PayoutProvider {
  isConfigured(): boolean {
    return true;
  }

  async sendPayout(input: PayoutInput): Promise<PayoutResult> {
    return { paid: true, ref: `mock:${input.withdrawalId.slice(0, 8)}` };
  }
}
