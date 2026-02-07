-- AlterTable (Evaluation.annotation_data - PDF annotator)
ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "annotation_data" JSONB;

-- CreateTable: timeline_posts
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

-- CreateTable: teacher_resources
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

-- CreateTable: error_bank_entries
CREATE TABLE IF NOT EXISTS "error_bank_entries" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "error_text" TEXT NOT NULL,
    "submission_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_bank_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: intervention_logs
CREATE TABLE IF NOT EXISTS "intervention_logs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey timeline_posts
ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey teacher_resources
ALTER TABLE "teacher_resources" ADD CONSTRAINT "teacher_resources_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_resources" ADD CONSTRAINT "teacher_resources_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey error_bank_entries
ALTER TABLE "error_bank_entries" ADD CONSTRAINT "error_bank_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "error_bank_entries" ADD CONSTRAINT "error_bank_entries_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "error_bank_entries" ADD CONSTRAINT "error_bank_entries_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey intervention_logs
ALTER TABLE "intervention_logs" ADD CONSTRAINT "intervention_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "intervention_logs" ADD CONSTRAINT "intervention_logs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
