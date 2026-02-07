-- CreateTable
CREATE TABLE "student_skill_scores" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "vocabulary" INTEGER NOT NULL DEFAULT 0,
    "grammar" INTEGER NOT NULL DEFAULT 0,
    "listening" INTEGER NOT NULL DEFAULT 0,
    "speaking" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_skill_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_skill_scores_student_id_key" ON "student_skill_scores"("student_id");

-- AddForeignKey
ALTER TABLE "student_skill_scores" ADD CONSTRAINT "student_skill_scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
