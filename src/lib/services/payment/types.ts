// Ödeme (İyzico) entegrasyonu domain tipleri. Uygulama yalnız bunlara bağlıdır;
// İyzico'nun alanları "live" provider içinde izole edilir.

export type PaymentPurpose = "package" | "qr_order";

export interface CheckoutBuyer {
  id: string;
  email: string;
  name?: string;
  ip?: string; // gerçek istek IP'si (İyzico zorunlu)
  phone?: string;
  identityNumber?: string; // TCKN; yoksa placeholder
}

// İyzico billing/shipping adresi (ecom akışında zorunlu).
export interface CheckoutAddress {
  contactName?: string;
  city?: string;
  address?: string;
  country?: string;
  zipCode?: string;
}

export interface CheckoutInput {
  purpose: PaymentPurpose;
  // package → userId; qr_order → qrOrder.id
  refId: string;
  amount: number; // TRY
  description: string;
  buyer: CheckoutBuyer;
  // Fatura/teslimat adresi (qr_order → kargo; package → restoran bilgisi).
  address?: CheckoutAddress;
  // İyzico ödeme bittiğinde buraya döner (live).
  callbackUrl: string;
  // Ek bilgi (ör. package için plan); live'da conversationId'ye gömülür,
  // callback verify'da geri okunur.
  meta?: string;
}

export interface CheckoutResult {
  // mock/instant: paid=true → çağıran taraf hemen fulfill eder.
  // live: paid=false + checkoutUrl (İyzico ödeme sayfası) + token.
  paid: boolean;
  checkoutUrl?: string;
  token?: string;
}

export interface VerifyResult {
  paid: boolean;
  token: string;
  purpose?: PaymentPurpose;
  refId?: string;
  meta?: string;
}

export class PaymentNotConfiguredError extends Error {
  constructor() {
    super("Ödeme entegrasyonu yapılandırılmamış (PAYMENT_PROVIDER=stub).");
    this.name = "PaymentNotConfiguredError";
  }
}
