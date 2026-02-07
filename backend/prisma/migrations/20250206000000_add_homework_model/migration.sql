-- CreateTable
CREATE TABLE "homeworks" (
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

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN "homework_id" TEXT;

-- CreateIndex
CREATE INDEX "homeworks_teacher_id_idx" ON "homeworks"("teacher_id");
CREATE INDEX "homeworks_level_id_idx" ON "homeworks"("level_id");

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
