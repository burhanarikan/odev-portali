-- Production DB zaten dolu (db push ile oluşturulmuş); migration geçmişi yok (P3005).
-- Bu script eksik sütunları/tabloyu ekler. Sonra "prisma migrate resolve --applied" ile baseline yapın.
-- Neon Dashboard → SQL Editor'da çalıştırın veya: psql $DATABASE_URL -f prisma/baseline-production.sql

-- 1) homeworks tablosu yoksa oluştur (ilk migration ile uyumlu)
CREATE TABLE IF NOT EXISTS "homeworks" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- 2) assignments
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "homework_id" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_review_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_reviews_per_student" INTEGER NOT NULL DEFAULT 2;

-- 3) submissions
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- 4) homeworks (ek sütunlar; tablo zaten varsa)
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "audio_url" TEXT;

-- 5) homeworks index'leri (yoksa oluştur; hata verirse yok sayın)
CREATE INDEX IF NOT EXISTS "homeworks_teacher_id_idx" ON "homeworks"("teacher_id");
CREATE INDEX IF NOT EXISTS "homeworks_level_id_idx" ON "homeworks"("level_id");

-- 6) Foreign key (zaten varsa hata verir; o satırı atlayın)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_homework_id_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_homework_id_fkey"
      FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homeworks_teacher_id_fkey') THEN
    ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacher_id_fkey"
      FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homeworks_level_id_fkey') THEN
    ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_level_id_fkey"
      FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
