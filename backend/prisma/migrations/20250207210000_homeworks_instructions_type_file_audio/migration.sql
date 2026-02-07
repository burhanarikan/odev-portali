-- homeworks: Prisma şemasındaki instructions, type, fileUrl, audioUrl kolonları
-- (İlk homework migration'da yoktu; ödev oluştururken "column does not exist" hatasını önler.)
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
