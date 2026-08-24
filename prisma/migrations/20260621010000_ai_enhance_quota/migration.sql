-- AI fotoğraf canlandırma (Nano Banana) aylık kotası — paketlerin ana farkı.
ALTER TABLE "subscriptions" ADD COLUMN "ai_enhancements_used" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN "ai_enhance_reset_at" TIMESTAMP(3);
