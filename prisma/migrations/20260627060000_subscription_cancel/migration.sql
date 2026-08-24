-- Abonelik: dönem sonunda otomatik yenilenmesin (iptal) bayrağı.
ALTER TABLE "subscriptions"
  ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;
