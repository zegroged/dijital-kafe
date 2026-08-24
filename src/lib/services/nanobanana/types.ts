// Nano Banana (Google Gemini görsel modeli) ile FOTOĞRAF CANLANDIRMA entegrasyonu
// için domain tipleri. Uygulamanın geri kalanı SADECE bu tiplere bağlıdır;
// gerçek Gemini API'sinin alan adları "live" provider'ın içinde izole edilir.
//
// Amaç: Müşterilerin telefon kameralarına güvenmiyoruz. Yüklenen yemek
// fotoğrafının İÇERİĞİNİ değiştirmeden renklerini/ışığını canlandırıp daha
// iştah açıcı, profesyonel bir görsele dönüştürmek. Sahip önce/sonra görüp
// onaylar; onaylarsa canlandırılmış görsel yayına girer (orijinal korunur).

export interface EnhanceInput {
  bytes: Buffer; // orijinal görsel baytları
  mimeType: string; // örn. "image/webp" | "image/jpeg"
}

export interface EnhanceResult {
  bytes: Buffer; // canlandırılmış görsel baytları
  mimeType: string; // örn. "image/png" (Gemini) | "image/webp" (mock)
}

// SABİT PROMPT — içerik değişmesin, sadece renk/ışık canlandırılsın.
// İngilizce yazıldı; Gemini görsel modellerinde talimatlara daha tutarlı uyar.
export const COLOR_ENHANCE_PROMPT = [
  "You are a professional food photography color grader.",
  "Enhance ONLY the color, white balance, contrast and lighting of this food photo",
  "to make it look vivid, fresh and appetizing, like a professional menu shot.",
  "Strict rules: DO NOT change the composition, framing or crop.",
  "DO NOT add, remove, move or alter any food, garnish, plate, cutlery, hands or background object.",
  "DO NOT change the shape, amount or type of the food. Keep it 100% photorealistic.",
  "Only adjust colors, saturation, brightness, shadows and sharpness.",
  "Return the same photo, same angle, just better lit and more colorful.",
].join(" ");

export class ImageEnhanceNotConfiguredError extends Error {
  constructor() {
    super(
      "Nano Banana (görsel canlandırma) entegrasyonu yapılandırılmamış (NANOBANANA_PROVIDER=stub).",
    );
    this.name = "ImageEnhanceNotConfiguredError";
  }
}
