-- Production'da "column does not exist" ve eksik tablo hatalarını gidermek için.
-- Bir kez çalıştırın: DATABASE_URL="..." npx prisma db execute --file prisma/production-fix-all.sql

-- Prisma enum: HomeworkType (seed ve ödev oluşturma için gerekli)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HomeworkType') THEN
    CREATE TYPE "HomeworkType" AS ENUM ('TEXT', 'FILE', 'AUDIO', 'MIXED');
  END IF;
END $$;
-- homeworks.type kolonu TEXT ise enum'a çevir (Prisma Client enum bekliyor)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'homeworks' AND column_name = 'type')
     AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'homeworks' AND column_name = 'type') = 'text' THEN
    ALTER TABLE "homeworks" ALTER COLUMN "type" DROP DEFAULT;
    ALTER TABLE "homeworks" ALTER COLUMN "type" TYPE "HomeworkType" USING "type"::"HomeworkType";
    ALTER TABLE "homeworks" ALTER COLUMN "type" SET DEFAULT 'TEXT'::"HomeworkType";
  END IF;
END $$;

-- timeline_posts (zaman tüneli)
CREATE TABLE IF NOT EXISTS "timeline_posts" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "image_url" TEXT,
    "link_url" TEXT,
    "post_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timeline_posts_pkey" PRIMARY KEY ("id")
);

-- announcements (duyurular)
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- error_bank_entries (hata bankası)
CREATE TABLE IF NOT EXISTS "error_bank_entries" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "error_text" TEXT NOT NULL,
    "submission_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "error_bank_entries_pkey" PRIMARY KEY ("id")
);

-- teacher_resources (ders paylaşım havuzu)
CREATE TABLE IF NOT EXISTS "teacher_resources" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT,
    "link_url" TEXT,
    "level_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_resources_pkey" PRIMARY KEY ("id")
);

-- intervention_logs (müdahale logları)
CREATE TABLE IF NOT EXISTS "intervention_logs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intervention_logs_pkey" PRIMARY KEY ("id")
);

-- user_consents: findUnique(userId) için unique index gerekli (şemada userId @unique)
CREATE TABLE IF NOT EXISTS "user_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_consents_user_id_key" ON "user_consents"("user_id");

-- homeworks tablosu yoksa oluştur (ödev oluşturma için gerekli)
CREATE TABLE IF NOT EXISTS "homeworks" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "type" "HomeworkType" NOT NULL DEFAULT 'TEXT'::"HomeworkType",
    "fileUrl" TEXT,
    "audioUrl" TEXT,
    "level_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- assignments
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "homework_id" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_review_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "peer_reviews_per_student" INTEGER NOT NULL DEFAULT 2;

-- submissions
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- evaluations (PDF annotator)
ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "annotation_data" JSONB;

-- homeworks (Prisma alan adı: fileUrl, audioUrl → DB'de aynı veya file_url/audio_url)
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "type" "HomeworkType" NOT NULL DEFAULT 'TEXT'::"HomeworkType";
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "audio_url" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE "homeworks" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;

-- attendance_sessions (yoksa oluştur)
CREATE TABLE IF NOT EXISTS "attendance_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "topic" TEXT,
    "resource_links" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_sessions_code_key" ON "attendance_sessions"("code");

-- attendance_records (yoksa oluştur)
CREATE TABLE IF NOT EXISTS "attendance_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_ok" BOOLEAN NOT NULL DEFAULT false,
    "reject_reason" TEXT,
    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_session_id_student_id_key" ON "attendance_records"("session_id", "student_id");

-- make_up_slots
CREATE TABLE IF NOT EXISTS "make_up_slots" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "slot_end" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "max_students" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "make_up_slots_pkey" PRIMARY KEY ("id")
);

-- make_up_bookings
CREATE TABLE IF NOT EXISTS "make_up_bookings" (
    "id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "make_up_bookings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "make_up_bookings_slot_id_student_id_key" ON "make_up_bookings"("slot_id", "student_id");

-- student_skill_scores
CREATE TABLE IF NOT EXISTS "student_skill_scores" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "vocabulary" INTEGER NOT NULL DEFAULT 0,
    "grammar" INTEGER NOT NULL DEFAULT 0,
    "listening" INTEGER NOT NULL DEFAULT 0,
    "speaking" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_skill_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "student_skill_scores_student_id_key" ON "student_skill_scores"("student_id");

-- homeworks FK'ler (tablo yeni oluşturulduysa)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homeworks_teacher_id_fkey') THEN
    ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homeworks_level_id_fkey') THEN
    ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_homework_id_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;

-- Foreign key'ler (tablo zaten varsa eklenmiş olabilir; hata verirse yok sayın)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_class_id_fkey') THEN
    ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_teacher_id_fkey') THEN
    ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_session_id_fkey') THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_student_id_fkey') THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'make_up_slots_class_id_fkey') THEN
    ALTER TABLE "make_up_slots" ADD CONSTRAINT "make_up_slots_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'make_up_slots_teacher_id_fkey') THEN
    ALTER TABLE "make_up_slots" ADD CONSTRAINT "make_up_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'make_up_bookings_slot_id_fkey') THEN
    ALTER TABLE "make_up_bookings" ADD CONSTRAINT "make_up_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "make_up_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'make_up_bookings_student_id_fkey') THEN
    ALTER TABLE "make_up_bookings" ADD CONSTRAINT "make_up_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_skill_scores_student_id_fkey') THEN
    ALTER TABLE "student_skill_scores" ADD CONSTRAINT "student_skill_scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;

-- timeline_posts, announcements, error_bank_entries, teacher_resources, intervention_logs FK'ler
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_posts_class_id_fkey') THEN
    ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_posts_teacher_id_fkey') THEN
    ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_author_id_fkey') THEN
    ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'error_bank_entries_student_id_fkey') THEN
    ALTER TABLE "error_bank_entries" ADD CONSTRAINT "error_bank_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'error_bank_entries_teacher_id_fkey') THEN
    ALTER TABLE "error_bank_entries" ADD CONSTRAINT "error_bank_entries_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'error_bank_entries_submission_id_fkey') THEN
    ALTER TABLE "error_bank_entries" ADD CONSTRAINT "error_bank_entries_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_resources_teacher_id_fkey') THEN
    ALTER TABLE "teacher_resources" ADD CONSTRAINT "teacher_resources_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_resources_level_id_fkey') THEN
    ALTER TABLE "teacher_resources" ADD CONSTRAINT "teacher_resources_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_logs_student_id_fkey') THEN
    ALTER TABLE "intervention_logs" ADD CONSTRAINT "intervention_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_logs_teacher_id_fkey') THEN
    ALTER TABLE "intervention_logs" ADD CONSTRAINT "intervention_logs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
