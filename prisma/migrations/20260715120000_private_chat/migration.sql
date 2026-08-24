-- Özel sohbet (2 kişilik). Erişim env CHAT_MEMBERS ile kilitli.
CREATE TYPE "ChatKind" AS ENUM ('text', 'voice');

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "kind" "ChatKind" NOT NULL DEFAULT 'text',
    "body" TEXT,
    "audio_mime" TEXT,
    "audio_size" INTEGER,
    "duration_ms" INTEGER,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Mutabakat sorgusunun sayfalanabilir tek imleci.
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");
CREATE INDEX "chat_messages_updated_at_idx" ON "chat_messages"("updated_at");

ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ses ham verisi ayrı tabloda: mesaj listesi sorgusu blob çekmesin.
CREATE TABLE "chat_audio" (
    "message_id" UUID NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "chat_audio_pkey" PRIMARY KEY ("message_id")
);

ALTER TABLE "chat_audio"
    ADD CONSTRAINT "chat_audio_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
