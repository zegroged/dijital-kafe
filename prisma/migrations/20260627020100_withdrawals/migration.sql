-- Komisyoncu çekim sistemi: vergi durumu + çekim talebi + kalem + stopaj alanları.

CREATE TYPE "WithdrawalStatus" AS ENUM ('requested', 'approved', 'processing', 'paid', 'rejected');
CREATE TYPE "TaxStatus" AS ENUM ('individual_no_tax', 'tax_registered');

-- affiliates: vergi durumu + belge.
ALTER TABLE "affiliates"
  ADD COLUMN "tax_status" "TaxStatus" NOT NULL DEFAULT 'individual_no_tax',
  ADD COLUMN "tax_doc_url" TEXT;

-- withdrawal_requests (çekim talebi)
CREATE TABLE "withdrawal_requests" (
  "id" UUID NOT NULL,
  "affiliate_id" UUID NOT NULL,
  "status" "WithdrawalStatus" NOT NULL DEFAULT 'requested',
  "gross_amount" DECIMAL(10,2) NOT NULL,
  "tax_status" "TaxStatus" NOT NULL,
  "withholding_rate" DECIMAL(4,3) NOT NULL,
  "withholding_amount" DECIMAL(10,2) NOT NULL,
  "net_amount" DECIMAL(10,2) NOT NULL,
  "iban_snapshot" TEXT,
  "holder_snapshot" TEXT,
  "tax_doc_url_snapshot" TEXT,
  "admin_note" TEXT,
  "reject_reason" TEXT,
  "payment_ref" TEXT,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approved_at" TIMESTAMP(3),
  "paid_at" TIMESTAMP(3),
  "rejected_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "withdrawal_requests_affiliate_id_idx" ON "withdrawal_requests"("affiliate_id");
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");
-- Komisyoncu başına AYNI ANDA tek açık talep (requested/approved/processing).
CREATE UNIQUE INDEX "withdrawal_one_open_per_affiliate"
  ON "withdrawal_requests"("affiliate_id")
  WHERE "status" IN ('requested', 'approved', 'processing');

-- withdrawal_items (talebin kapsadığı komisyonlar)
CREATE TABLE "withdrawal_items" (
  "id" UUID NOT NULL,
  "withdrawal_id" UUID NOT NULL,
  "commission_id" UUID NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "withdrawal_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_items_commission_id_key" ON "withdrawal_items"("commission_id");
CREATE INDEX "withdrawal_items_withdrawal_id_idx" ON "withdrawal_items"("withdrawal_id");

ALTER TABLE "withdrawal_requests"
  ADD CONSTRAINT "withdrawal_requests_affiliate_id_fkey"
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_items"
  ADD CONSTRAINT "withdrawal_items_withdrawal_id_fkey"
  FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_items"
  ADD CONSTRAINT "withdrawal_items_commission_id_fkey"
  FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
