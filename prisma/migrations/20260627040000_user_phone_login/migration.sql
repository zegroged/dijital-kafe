-- Komisyoncu hesapları e-posta yerine TELEFON ile açılır/giriş yapar.
-- email artık opsiyonel; phone benzersiz (NULL'lar çoklu olabilir → owner'larda phone NULL).
ALTER TABLE "profiles" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "profiles" ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "profiles_phone_key" ON "profiles"("phone");
