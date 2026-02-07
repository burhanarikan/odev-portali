-- Add missing columns to submissions (schema had them but no migration existed)
-- Safe to run: IF NOT EXISTS / do nothing if column already present (Postgres 9.5+)
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
