-- assignments tablosunda eksik peer review sütunları (Prisma şeması ile uyum için)
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_review_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_reviews_per_student" INTEGER NOT NULL DEFAULT 2;
