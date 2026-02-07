-- Production'da "column does not exist" ve consent tablosu hatalarını gidermek için.
-- Bir kez çalıştırın: DATABASE_URL="..." npx prisma db execute --file prisma/production-fix-all.sql

-- user_consents: findUnique(userId) için unique index gerekli (şemada userId @unique)
CREATE TABLE IF NOT EXISTS "user_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_consents_user_id_key" ON "user_consents"("user_id");

-- assignments
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "homework_id" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_review_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_reviews_per_student" INTEGER NOT NULL DEFAULT 2;

-- submissions
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- homeworks
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "audio_url" TEXT;
