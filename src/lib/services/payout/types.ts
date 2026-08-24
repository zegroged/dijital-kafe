// Komisyoncu çekim ödemesi (payout) domain tipleri. Uygulama yalnız bunlara
// bağlıdır; sağlayıcının (Papara vb.) alanları "live" provider içinde izole olur.

export interface PayoutInput {
  withdrawalId: string;
  amount: number; // NET tutar (TRY) — stopaj zaten düşülmüş
  holder: string; // IBAN sahibi ad soyad
  iban: string;
  description?: string;
}

export interface PayoutResult {
  // manual/mock/anlık → paid=true (çağıran taraf hemen "ödendi" işaretler)
  paid: boolean;
  // live/asenkron → processing=true (sonuç webhook/verify ile gelir)
  processing?: boolean;
  ref?: string; // sağlayıcı referansı (idempotensi)
}
