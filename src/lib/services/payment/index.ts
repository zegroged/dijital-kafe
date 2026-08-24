import { env } from "@/lib/env";
import { LivePaymentProvider } from "./live";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./provider";
import { StubPaymentProvider } from "./stub";

export type { PaymentProvider } from "./provider";
export * from "./types";

let instance: PaymentProvider | undefined;

// PAYMENT_PROVIDER değerine göre sağlayıcı (singleton).
//   live → gerçek İyzico (key gerekir)
//   mock → anında başarılı (test)
//   stub → ödeme kapalı (varsayılan)
export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  switch (env.PAYMENT_PROVIDER) {
    case "live":
      if (env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY && env.IYZICO_BASE_URL) {
        instance = new LivePaymentProvider({
          apiKey: env.IYZICO_API_KEY,
          secretKey: env.IYZICO_SECRET_KEY,
          baseUrl: env.IYZICO_BASE_URL,
        });
      } else {
        console.warn("[payment] PAYMENT_PROVIDER=live ama İyzico anahtarları eksik → stub.");
        instance = new StubPaymentProvider();
      }
      break;
    case "mock":
      instance = new MockPaymentProvider();
      break;
    default:
      instance = new StubPaymentProvider();
  }
  return instance;
}
