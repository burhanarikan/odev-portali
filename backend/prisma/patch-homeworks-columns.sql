-- homeworks tablosunda eksik sütunlar (Prisma şeması ile uyum)
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "audio_url" TEXT;
