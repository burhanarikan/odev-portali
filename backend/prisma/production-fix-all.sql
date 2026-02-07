-- Production'da "column does not exist" hatalarını gidermek için tüm bilinen eksik sütunlar.
-- Bir kez çalıştırın: DATABASE_URL="..." npx prisma db execute --file prisma/production-fix-all.sql

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
