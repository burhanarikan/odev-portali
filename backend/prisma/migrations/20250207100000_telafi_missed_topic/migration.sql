-- AlterTable AttendanceSession: topic + resource_links
ALTER TABLE "attendance_sessions" ADD COLUMN IF NOT EXISTS "topic" TEXT;
ALTER TABLE "attendance_sessions" ADD COLUMN IF NOT EXISTS "resource_links" JSONB DEFAULT '[]';

-- CreateTable make_up_slots
CREATE TABLE "make_up_slots" (
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

-- CreateTable make_up_bookings
CREATE TABLE "make_up_bookings" (
    "id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "make_up_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "make_up_bookings_slot_id_student_id_key" ON "make_up_bookings"("slot_id", "student_id");

-- AddForeignKey
ALTER TABLE "make_up_slots" ADD CONSTRAINT "make_up_slots_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "make_up_slots" ADD CONSTRAINT "make_up_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "make_up_bookings" ADD CONSTRAINT "make_up_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "make_up_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "make_up_bookings" ADD CONSTRAINT "make_up_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
