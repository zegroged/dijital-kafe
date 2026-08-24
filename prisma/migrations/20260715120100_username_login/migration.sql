-- Kullanıcı adıyla giriş (küçük harf saklanır). E-postası/telefonu olmayan
-- özel hesaplar için; genel kayıt akışı bu alanı doldurmaz.
ALTER TABLE "profiles" ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");
