-- CreateTable
CREATE TABLE "teacher_wiki_pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_wiki_pages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "teacher_wiki_pages" ADD CONSTRAINT "teacher_wiki_pages_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
