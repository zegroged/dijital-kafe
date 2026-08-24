import { DEFAULT_WITHHOLDING_RATE, type TaxStatus } from "@/lib/constants";
import { env } from "@/lib/env";
import { getSetting, SETTING_WITHHOLDING_RATE } from "@/lib/settings";

export const round2 = (n: number) => Math.round(n * 100) / 100;
// Oran Decimal(4,3) ile saklanır → 3 ondalığa normalize ki snapshot ↔ uygulanan ayrışmasın.
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

// Aktif stopaj oranı: mali müşavirin panelden belirlediği (DB) > env > varsayılan.
// DİKKAT: oran mali müşavir onayına tabidir (bkz. constants).
export async function getWithholdingRate(): Promise<number> {
  const fromDb = await getSetting(SETTING_WITHHOLDING_RATE);
  const dbNum = fromDb != null ? Number(fromDb) : NaN;
  if (Number.isFinite(dbNum) && dbNum >= 0 && dbNum <= 1) return round3(dbNum);
  return round3(env.WITHHOLDING_RATE ?? DEFAULT_WITHHOLDING_RATE);
}

export interface WithholdingResult {
  rate: number; // uygulanan oran (mükellefte 0)
  withholding: number; // kesilen stopaj
  net: number; // gönderilecek net
}

// Stopaj hesabı.
//   tax_registered    → BRÜT gönderilir (komisyoncu kendi beyan eder), kesinti yok.
//   individual_no_tax → oran kadar stopaj kesilir, NET gönderilir.
// rate ÇAĞIRAN tarafından getWithholdingRate() ile verilir (3 ondalığa normalize edilmiş).
export function computeWithholding(
  gross: number,
  taxStatus: TaxStatus,
  rate: number,
): WithholdingResult {
  if (taxStatus === "tax_registered") {
    return { rate: 0, withholding: 0, net: round2(gross) };
  }
  const r = round3(rate);
  const withholding = round2(gross * r);
  return { rate: r, withholding, net: round2(gross - withholding) };
}
