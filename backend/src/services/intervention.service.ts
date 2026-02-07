import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class InterventionService {
  /** Kırmızı alarm: 2 ardışık devamsızlık veya 2 kaçan ödev. Öğretmen sadece kendi yoklama/ödev verdiği sınıf ve öğrencileri görür. */
  async getAtRiskStudents(teacherUserId?: string) {
    let allowedClassIds = new Set<string>();
    let allowedStudentIds = new Set<string>();
    if (teacherUserId) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId } });
      if (teacher) {
        const sessions = await prisma.attendanceSession.findMany({ where: { teacherId: teacher.id }, select: { classId: true } });
        sessions.forEach((s) => { if (s.classId) allowedClassIds.add(s.classId); });
        const targets = await prisma.assignmentTarget.findMany({
          where: { assignment: { createdBy: teacher.id } },
          select: { classId: true, studentId: true },
        });
        targets.forEach((t) => {
          if (t.classId) allowedClassIds.add(t.classId);
          if (t.studentId) allowedStudentIds.add(t.studentId);
        });
      }
    }

    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
        class: { include: { level: { select: { name: true } } } },
        attendanceRecords: { include: { session: { select: { startTime: true } } } },
        submissions: { select: { assignmentId: true } },
      },
    });

    const now = new Date();
    const atRisk: Array<{
      studentId: string;
      studentName: string;
      email: string;
      className: string;
      levelName: string;
      reasons: string[];
      lastIntervention?: string;
    }> = [];

    for (const s of students) {
      const reasons: string[] = [];

      const sessionsForClass = await prisma.attendanceSession.findMany({
        where: { classId: s.classId },
        orderBy: { startTime: 'desc' },
        take: 30,
      });
      const sessionDates = [...new Set(sessionsForClass.map((x) => x.startTime.toISOString().slice(0, 10)))].sort().reverse();
      const attendedDates = new Set(s.attendanceRecords.map((r) => r.session.startTime.toISOString().slice(0, 10)));
      let consecutiveAbsent = 0;
      for (const d of sessionDates) {
        if (!attendedDates.has(d)) consecutiveAbsent++;
        else break;
      }
      if (consecutiveAbsent >= 2) reasons.push('Üst üste 2 gün devamsızlık');

      const assignmentsDue = await prisma.assignment.findMany({
        where: {
          levelId: s.class?.levelId ?? '',
          isDraft: false,
          dueDate: { lt: now },
          OR: [
            { targets: { none: {} } },
            { targets: { some: { classId: s.classId } } },
            { targets: { some: { studentId: s.id } } },
          ],
        },
        select: { id: true },
      });
      const submittedIds = new Set(s.submissions.map((x) => x.assignmentId));
      const missed = assignmentsDue.filter((a) => !submittedIds.has(a.id));
      if (missed.length >= 2) reasons.push('2 veya daha fazla ödev kaçırıldı');

      if (reasons.length === 0) continue;

      if (teacherUserId && (allowedClassIds.size > 0 || allowedStudentIds.size > 0)) {
        if (!allowedClassIds.has(s.classId) && !allowedStudentIds.has(s.id)) continue;
      }

      const lastLog = await prisma.interventionLog.findFirst({
        where: { studentId: s.id },
        orderBy: { createdAt: 'desc' },
      });

      atRisk.push({
        studentId: s.id,
        studentName: s.user.name,
        email: s.user.email,
        className: s.class?.name ?? '—',
        levelName: s.class?.level?.name ?? '—',
        reasons,
        lastIntervention: lastLog?.createdAt.toISOString(),
      });
    }

    return atRisk;
  }

  async addLog(
    teacherUserId: string,
    data: { studentId: string; reason: string; note?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);
    return prisma.interventionLog.create({
      data: {
        studentId: data.studentId,
        teacherId: teacher.id,
        reason: data.reason.trim(),
        note: data.note?.trim() || null,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        teacher: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async getLogs(studentId?: string, teacherUserId?: string, callerRole?: string) {
    const where: { studentId?: string | { in: string[] } } = {};
    if (studentId) where.studentId = studentId;
    if (callerRole === 'TEACHER' && teacherUserId) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId } });
      if (teacher) {
        const allowedClassIds = new Set<string>();
        const allowedStudentIds = new Set<string>();
        const sessions = await prisma.attendanceSession.findMany({ where: { teacherId: teacher.id }, select: { classId: true } });
        sessions.forEach((s) => { if (s.classId) allowedClassIds.add(s.classId); });
        const targets = await prisma.assignmentTarget.findMany({
          where: { assignment: { createdBy: teacher.id } },
          select: { classId: true, studentId: true },
        });
        targets.forEach((t) => {
          if (t.classId) allowedClassIds.add(t.classId);
          if (t.studentId) allowedStudentIds.add(t.studentId);
        });
        const studentsInScope = await prisma.student.findMany({
          where: { OR: [{ classId: { in: Array.from(allowedClassIds) } }, { id: { in: Array.from(allowedStudentIds) } }] },
          select: { id: true },
        });
        const ids = studentsInScope.map((s) => s.id);
        if (ids.length === 0) return [];
        if (studentId) {
          if (!ids.includes(studentId)) return [];
          where.studentId = studentId;
        } else {
          where.studentId = { in: ids };
        }
      }
    }
    const logs = await prisma.interventionLog.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return logs;
  }
}
