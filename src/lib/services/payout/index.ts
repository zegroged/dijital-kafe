import { env } from "@/lib/env";
import { ManualPayoutProvider } from "./manual";
import { MockPayoutProvider } from "./mock";
import { PaparaPayoutProvider } from "./papara";
import type { PayoutProvider } from "./provider";

export type { PayoutProvider } from "./provider";
export * from "./types";

let instance: PayoutProvider | undefined;

// PAYOUT_PROVIDER değerine göre sağlayıcı (singleton).
//   papara → Papara Business toplu ödeme (key gerekir)
//   mock   → anında ödendi (test)
//   manual → admin elle/CSV ile gönderir (varsayılan)
export function getPayoutProvider(): PayoutProvider {
  if (instance) return instance;
  switch (env.PAYOUT_PROVIDER) {
    case "papara":
      if (env.PAPARA_API_KEY && env.PAPARA_API_BASE) {
        instance = new PaparaPayoutProvider({
          apiKey: env.PAPARA_API_KEY,
          baseUrl: env.PAPARA_API_BASE,
        });
      } else {
        console.warn(
          "[payout] PAYOUT_PROVIDER=papara ama anahtar/baz eksik → manual'e düşülüyor.",
        );
        instance = new ManualPayoutProvider();
      }
      break;
    case "mock":
      instance = new MockPayoutProvider();
      break;
    default:
      instance = new ManualPayoutProvider();
  }
  return instance;
}
