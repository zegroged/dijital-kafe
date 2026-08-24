import { createHmac, randomBytes } from "node:crypto";
import type { PaymentProvider } from "./provider";
import type {
  CheckoutInput,
  CheckoutResult,
  PaymentPurpose,
  VerifyResult,
} from "./types";

// ============================================================================
//  GERÇEK İYZİCO ENTEGRASYONU (CheckoutForm + authV2).
//  Key alınınca yapılacaklar:
//   1. .env: PAYMENT_PROVIDER=live, IYZICO_API_KEY, IYZICO_SECRET_KEY,
//      IYZICO_BASE_URL (sandbox: https://sandbox-api.iyzipay.com).
//   2. İyzico panelinde callback URL'i (https://to-p1.com/api/payment/callback) tanımla.
//   3. Aşağıdaki TODO'ları İyzico güncel dokümanıyla doğrula (alan adları,
//      buyer/address zorunlu alanları, response yolu). authV2 imzası hazır.
//   Geri kalan her şey (fulfill, komisyon, sipariş akışı, UI) zaten çalışıyor.
// ============================================================================

interface LiveConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

const INIT_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const DETAIL_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

export class LivePaymentProvider implements PaymentProvider {
  constructor(private readonly cfg: LiveConfig) {}

  isConfigured(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.secretKey && this.cfg.baseUrl);
  }

  // İyzico authV2: Authorization: IYZWSv2 base64(apiKey&randomKey&signature)
  private authHeaders(uriPath: string, body: string) {
    const randomKey = `${Date.now()}${randomBytes(8).toString("hex")}`;
    const payload = randomKey + uriPath + body;
    const signature = createHmac("sha256", this.cfg.secretKey)
      .update(payload, "utf8")
      .digest("hex");
    const authString = `apiKey:${this.cfg.apiKey}&randomKey:${randomKey}&signature:${signature}`;
    const authorization = `IYZWSv2 ${Buffer.from(authString).toString("base64")}`;
    return {
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
      "Content-Type": "application/json",
    };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const price = input.amount.toFixed(2);
    // conversationId'ye amaç+refId+meta gömüyoruz → verify dönüşünde geri okuruz.
    const conversationId = `${input.purpose}:${input.refId}:${input.meta ?? ""}`;
    const [firstName, ...rest] = (input.buyer.name ?? "Musteri").split(" ");

    // Gerçek verilerle doldur; eksikse İyzico'nun kabul ettiği güvenli yedekler.
    const addr = input.address ?? {};
    const contactName = addr.contactName ?? input.buyer.name ?? "Musteri";
    const city = addr.city ?? "Istanbul";
    const country = addr.country ?? "Turkey";
    const addressLine = addr.address ?? "Adres bilgisi girilmedi";
    const ip = input.buyer.ip ?? "85.34.78.112";
    const identityNumber = input.buyer.identityNumber ?? "11111111111";
    const fullAddress = {
      contactName,
      city,
      country,
      address: addressLine,
      ...(addr.zipCode ? { zipCode: addr.zipCode } : {}),
    };

    const body = JSON.stringify({
      locale: "tr",
      conversationId,
      price,
      paidPrice: price,
      currency: "TRY",
      basketId: input.refId,
      paymentGroup: input.purpose === "qr_order" ? "PRODUCT" : "SUBSCRIPTION",
      callbackUrl: input.callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: input.buyer.id,
        name: firstName,
        surname: rest.join(" ") || firstName,
        email: input.buyer.email,
        ...(input.buyer.phone ? { gsmNumber: input.buyer.phone } : {}),
        identityNumber,
        registrationAddress: addressLine,
        city,
        country,
        ip,
      },
      // İyzico ecom akışında her ikisi de zorunlu.
      shippingAddress: fullAddress,
      billingAddress: fullAddress,
      basketItems: [
        {
          id: input.refId,
          name: input.description,
          category1: input.purpose === "qr_order" ? "Fiziksel QR" : "Abonelik",
          itemType: input.purpose === "qr_order" ? "PHYSICAL" : "VIRTUAL",
          price,
        },
      ],
    });

    const res = await fetch(`${this.cfg.baseUrl}${INIT_PATH}`, {
      method: "POST",
      headers: this.authHeaders(INIT_PATH, body),
      body,
    });
    const data = (await res.json()) as {
      status?: string;
      token?: string;
      paymentPageUrl?: string;
      checkoutFormContent?: string;
      errorMessage?: string;
    };
    if (data.status !== "success" || !data.token) {
      throw new Error(`İyzico başlatma hatası: ${data.errorMessage ?? res.status}`);
    }
    // TODO(iyzico): hosted sayfa için paymentPageUrl; embed için checkoutFormContent.
    return { paid: false, checkoutUrl: data.paymentPageUrl, token: data.token };
  }

  async verify(token: string): Promise<VerifyResult> {
    const body = JSON.stringify({ locale: "tr", token });
    const res = await fetch(`${this.cfg.baseUrl}${DETAIL_PATH}`, {
      method: "POST",
      headers: this.authHeaders(DETAIL_PATH, body),
      body,
    });
    const data = (await res.json()) as {
      paymentStatus?: string;
      conversationId?: string;
    };
    const [purpose, refId, meta] = (data.conversationId ?? "::").split(":");
    return {
      paid: data.paymentStatus === "SUCCESS",
      token,
      purpose: (purpose || undefined) as PaymentPurpose | undefined,
      refId: refId || undefined,
      meta: meta || undefined,
    };
  }
}
