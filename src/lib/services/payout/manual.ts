import type { PayoutProvider } from "./provider";
import type { PayoutInput, PayoutResult } from "./types";

// Manuel mod (varsayılan): admin parayı dışarıdan gönderir (banka / Papara paneli
// + toplu CSV) ve "Öde"ye basınca sistem ödendi sayar. En kontrollü/güvenli yol;
// hiçbir dış anahtar gerektirmez. Papara API'si gelince provider değişir.
export class ManualPayoutProvider implements PayoutProvider {
  isConfigured(): boolean {
    return true;
  }

  async sendPayout(input: PayoutInput): Promise<PayoutResult> {
    return { paid: true, ref: `manual:${input.withdrawalId.slice(0, 8)}` };
  }
}
