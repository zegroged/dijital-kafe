-- İki tip komisyoncu + komisyon kazanç kayıtları.
--   CommissionType : one_time (ilk ödemeden bir kez %70) | recurring (her ödemeden %30)
--   commissions    : her ödeme bir kazanç kaydı üretir (recurring'de birden çok)
-- Yeni enum TİPLERİ aynı transaction'da kullanılabilir (gotcha yalnız enum ADD VALUE içindir).

CREATE TYPE "CommissionType" AS ENUM ('one_time', 'recurring');
CREATE TYPE "CommissionStatus" AS ENUM ('earned', 'paid', 'cancelled');

-- affiliates: kazanç tipi + varsayılan oranı %70'e çek (mevcut satırların oranı korunur).
ALTER TABLE "affiliates"
  ADD COLUMN "commission_type" "CommissionType" NOT NULL DEFAULT 'one_time';
ALTER TABLE "affiliates"
  ALTER COLUMN "commission_rate" SET DEFAULT 0.70;

-- commissions (her ödeme bir kazanç)
CREATE TABLE "commissions" (
  "id" UUID NOT NULL,
  "affiliate_id" UUID NOT NULL,
  "referral_id" UUID NOT NULL,
  "plan" "Plan" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "CommissionStatus" NOT NULL DEFAULT 'earned',
  "payment_ref" TEXT,
  "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commissions_affiliate_id_idx" ON "commissions"("affiliate_id");
CREATE INDEX "commissions_referral_id_idx" ON "commissions"("referral_id");

ALTER TABLE "commissions"
  ADD CONSTRAINT "commissions_affiliate_id_fkey"
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commissions"
  ADD CONSTRAINT "commissions_referral_id_fkey"
  FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mevcut earned/paid referansları yeni Commission tablosuna taşı (geçmiş kazançlar korunur).
INSERT INTO "commissions"
  ("id", "affiliate_id", "referral_id", "plan", "amount", "status", "earned_at", "paid_at", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  r."affiliate_id",
  r."id",
  r."plan",
  r."amount",
  (CASE r."status" WHEN 'paid' THEN 'paid' ELSE 'earned' END)::"CommissionStatus",
  COALESCE(r."earned_at", r."created_at"),
  r."paid_at",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "referrals" r
WHERE r."status" IN ('earned', 'paid')
  AND r."plan" IS NOT NULL
  AND r."amount" IS NOT NULL;
