import { env } from "@/lib/env";
import { LiveImageEnhanceProvider } from "./live";
import { MockImageEnhanceProvider } from "./mock";
import type { ImageEnhanceProvider } from "./provider";
import { StubImageEnhanceProvider } from "./stub";

export type { ImageEnhanceProvider } from "./provider";
export * from "./types";

let instance: ImageEnhanceProvider | undefined;

// NANOBANANA_PROVIDER değerine göre doğru sağlayıcıyı seçer (singleton).
//   live  → gerçek Gemini API (NANOBANANA_API_KEY gerekir)
//   mock  → sharp ile gerçek renk canlandırma (key gerekmez, akış testi)
//   stub  → entegrasyon yok (varsayılan)
export function getImageEnhanceProvider(): ImageEnhanceProvider {
  if (instance) return instance;

  switch (env.NANOBANANA_PROVIDER) {
    case "live":
      if (env.NANOBANANA_API_KEY) {
        instance = new LiveImageEnhanceProvider({
          apiKey: env.NANOBANANA_API_KEY,
          model: env.NANOBANANA_MODEL,
        });
      } else {
        console.warn(
          "[nanobanana] NANOBANANA_PROVIDER=live ama NANOBANANA_API_KEY eksik → stub'a düşülüyor.",
        );
        instance = new StubImageEnhanceProvider();
      }
      break;
    case "mock":
      instance = new MockImageEnhanceProvider();
      break;
    default:
      instance = new StubImageEnhanceProvider();
  }

  return instance;
}
