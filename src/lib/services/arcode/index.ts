import { env } from "@/lib/env";
import { LiveArCodeProvider } from "./live";
import { MockArCodeProvider } from "./mock";
import type { ArCodeProvider } from "./provider";
import { StubArCodeProvider } from "./stub";

export type { ArCodeProvider } from "./provider";
export * from "./types";

let instance: ArCodeProvider | undefined;

// ARCODE_PROVIDER değerine göre doğru sağlayıcıyı seçer (singleton).
//   live  → gerçek AR Code API (ARCODE_API_KEY gerekir)
//   mock  → örnek modellerle UI testi
//   stub  → entegrasyon yok (varsayılan)
export function getArCodeProvider(): ArCodeProvider {
  if (instance) return instance;

  switch (env.ARCODE_PROVIDER) {
    case "live":
      if (env.ARCODE_API_KEY && env.ARCODE_API_BASE) {
        instance = new LiveArCodeProvider({
          apiKey: env.ARCODE_API_KEY,
          apiBase: env.ARCODE_API_BASE,
          webhookSecret: env.ARCODE_WEBHOOK_SECRET,
        });
      } else {
        console.warn(
          "[arcode] ARCODE_PROVIDER=live ama ARCODE_API_KEY/BASE eksik → stub'a düşülüyor.",
        );
        instance = new StubArCodeProvider();
      }
      break;
    case "mock":
      instance = new MockArCodeProvider();
      break;
    default:
      instance = new StubArCodeProvider();
  }

  return instance;
}
