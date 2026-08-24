-- E-posta doğrulama jetonları (özellikle komisyoncular için).
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

ALTER TABLE "email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mevcut komisyoncuları (e-posta doğrulaması bu sürümden önce yoktu) "doğrulanmış"
-- say ki referans kodları pasife düşmesin. Yeni komisyoncular onay akışına tabi.
UPDATE "profiles"
SET "email_verified" = CURRENT_TIMESTAMP
WHERE "role" = 'affiliate' AND "email_verified" IS NULL;
