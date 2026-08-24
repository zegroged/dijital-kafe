-- Kategoriye özel renk/düzen yerine TAM tema (theme_settings JSON).
ALTER TABLE "categories" DROP COLUMN IF EXISTS "color";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "layout";
ALTER TABLE "categories" ADD COLUMN "theme_settings" JSONB;
