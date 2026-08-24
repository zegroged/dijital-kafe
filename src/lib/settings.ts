import { prisma } from "@/lib/prisma";

// Genel anahtar/değer ayarları (DB). Mali müşavirin panelden belirlediği
// stopaj oranı gibi değerler burada tutulur.
export const SETTING_WITHHOLDING_RATE = "withholding_rate";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
