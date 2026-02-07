import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { haversineDistance } from '../utils/haversine';

const CODE_LENGTH = 6;
const DEFAULT_DURATION_MINUTES = 15;
const MAX_DISTANCE_METERS = 50;

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export class AttendanceService {
  async startSession(
    teacherUserId: string,
    classId: string,
    durationMinutes: number = DEFAULT_DURATION_MINUTES,
    latitude?: number,
    longitude?: number
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Teacher not found', 404);

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
      include: { level: true },
    });
    if (!classExists) throw createError('Sınıf bulunamadı', 404);

    let code: string;
    let exists: { id: string } | null;
    do {
      code = generateCode();
      exists = await prisma.attendanceSession.findUnique({
        where: { code },
        select: { id: true },
      });
    } while (exists);

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const session = await prisma.attendanceSession.create({
      data: {
        code,
        classId,
        teacherId: teacher.id,
        startTime,
        endTime,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
      include: {
        class: { include: { level: true } },
        teacher: { include: { user: true } },
        _count: { select: { records: true } },
      },
    });
    return session;
  }

  async joinSession(
    studentUserId: string,
    code: string,
    latitude?: number,
    longitude?: number
  ) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { class: true },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    const session = await prisma.attendanceSession.findUnique({
      where: { code: code.trim() },
      include: {
        class: true,
        records: { select: { studentId: true } },
      },
    });

    if (!session) {
      return { success: false, reason: 'INVALID_CODE' as const, message: 'Geçersiz yoklama kodu.' };
    }

    if (new Date() > session.endTime) {
      return { success: false, reason: 'EXPIRED' as const, message: 'Yoklama süresi dolmuş.' };
    }

    if (session.classId !== student.classId) {
      return {
        success: false,
        reason: 'WRONG_CLASS' as const,
        message: 'Bu yoklama sizin sınıfınıza ait değil.',
      };
    }

    const alreadyJoined = session.records.some((r) => r.studentId === student.id);
    if (alreadyJoined) {
      return {
        success: false,
        reason: 'ALREADY_JOINED' as const,
        message: 'Bu yoklamaya zaten katıldınız.',
      };
    }

    let locationOk = false;
    let rejectReason: string | null = null;

    if (session.latitude != null && session.longitude != null) {
      if (latitude == null || longitude == null) {
        rejectReason = 'Konum bilgisi paylaşılmadı';
        // Kayıt oluşturuyoruz ama locationOk: false, rejectReason dolu (yönetim logu)
      } else {
        const distance = haversineDistance(
          session.latitude,
          session.longitude,
          latitude,
          longitude
        );
        if (distance > MAX_DISTANCE_METERS) {
          rejectReason = `Sınıf dışında olduğunuz için yoklama veremezsiniz (${Math.round(distance)}m uzakta, max ${MAX_DISTANCE_METERS}m).`;
        } else {
          locationOk = true;
        }
      }
    } else {
      locationOk = true;
    }

    await prisma.attendanceRecord.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        locationOk,
        rejectReason,
      },
    });

    if (!locationOk && rejectReason) {
      return {
        success: false,
        reason: 'LOCATION_REJECTED' as const,
        message: rejectReason,
      };
    }

    return {
      success: true,
      message: 'Yoklamaya katıldınız.',
    };
  }

  async getSessionLive(sessionId: string, teacherUserId?: string) {
    const teacherId = teacherUserId
      ? (await prisma.teacher.findUnique({ where: { userId: teacherUserId } }))?.id
      : null;

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class: { include: { level: true } },
        teacher: { include: { user: true } },
        records: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
    });
    if (!session) throw createError('Yoklama oturumu bulunamadı', 404);
    if (teacherId && session.teacherId !== teacherId) throw createError('Bu yoklamayı görüntüleme yetkiniz yok', 403);

    return {
      ...session,
      joinedCount: session.records.length,
      acceptedCount: session.records.filter((r) => r.locationOk).length,
    };
  }

  async getSessionByCode(code: string) {
    return prisma.attendanceSession.findUnique({
      where: { code: code.trim() },
      include: {
        class: { include: { level: true } },
        teacher: { include: { user: true } },
        _count: { select: { records: true } },
      },
    });
  }

  async getSessionsForTeacher(teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Teacher not found', 404);

    return prisma.attendanceSession.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: { include: { level: true } },
        _count: { select: { records: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    });
  }

  async getSessionsForClass(classId: string) {
    return prisma.attendanceSession.findMany({
      where: { classId },
      include: {
        teacher: { include: { user: true } },
        _count: { select: { records: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    });
  }

  /** Kur sonu: öğrencilerin toplam ders saati ve katıldığı ders saati, devamsızlık yüzdesi */
  async getAbsenceReport(classId?: string) {
    const classes = classId
      ? await prisma.class.findMany({ where: { id: classId }, include: { level: true } })
      : await prisma.class.findMany({ include: { level: true } });

    const result: Array<{
      studentId: string;
      studentName: string;
      className: string;
      levelName: string;
      totalSessions: number;
      attendedSessions: number;
      attendanceRate: number;
      absenceRate: number;
    }> = [];

    for (const cls of classes) {
      const students = await prisma.student.findMany({
        where: { classId: cls.id },
        include: { user: true },
      });
      const sessionCount = await prisma.attendanceSession.count({
        where: { classId: cls.id },
      });

      const sessionIds = await prisma.attendanceSession.findMany({
        where: { classId: cls.id },
        select: { id: true },
      }).then((s) => s.map((x) => x.id));

      for (const student of students) {
        const attended = await prisma.attendanceRecord.count({
          where: {
            sessionId: { in: sessionIds },
            studentId: student.id,
            locationOk: true,
          },
        });
        const totalSessions = sessionCount;
        const attendanceRate = totalSessions > 0 ? (attended / totalSessions) * 100 : 100;
        const absenceRate = 100 - attendanceRate;

        result.push({
          studentId: student.id,
          studentName: student.user.name,
          className: cls.name,
          levelName: cls.level?.name ?? '—',
          totalSessions,
          attendedSessions: attended,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          absenceRate: Math.round(absenceRate * 100) / 100,
        });
      }
    }

    return result;
  }
}
