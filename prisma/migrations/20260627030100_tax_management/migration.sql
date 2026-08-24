-- Mali müşavir vergi yönetimi: genel ayar tablosu + çekim taleplerine gider pusulası alanları.

CREATE TABLE "settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "withdrawal_requests"
  ADD COLUMN "tax_recorded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tax_document_no" TEXT,
  ADD COLUMN "tax_document_at" TIMESTAMP(3),
  ADD COLUMN "tax_note" TEXT;
