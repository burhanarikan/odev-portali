import { prisma } from '../config/database';

interface DashboardStats {
  totalAssignments: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  assignmentsByLevel: Array<{ levelName: string; count: number }>;
  submissionsByWeek: Array<{ weekNumber: number; count: number }>;
  recentActivity: Array<{
    type: 'assignment_created' | 'submission' | 'evaluation';
    title: string;
    user: string;
    timestamp: Date;
  }>;
}

export class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalAssignments,
      totalStudents,
      totalTeachers,
      totalSubmissions,
      avgScore,
    ] = await Promise.all([
      prisma.assignment.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.submission.count(),
      prisma.evaluation.aggregate({
        _avg: { score: true },
      }),
    ]);

    const assignmentsByLevelData = await prisma.assignment.groupBy({
      by: ['levelId'],
      _count: true,
    });

    const levels = await prisma.level.findMany({
      where: {
        id: {
          in: assignmentsByLevelData.map((item: { levelId: string }) => item.levelId)
        }
      }
    });

    const assignmentsByLevel = assignmentsByLevelData.map((item: { levelId: string; _count: number }) => {
      const level = levels.find((l: { id: string; name?: string }) => l.id === item.levelId);
      return {
        levelName: level?.name || 'Bilinmeyen',
        count: item._count,
      };
    });

    const submissionsByWeekData = await prisma.submission.groupBy({
      by: ['assignmentId'],
      _count: true,
    });

    const assignments = await prisma.assignment.findMany({
      where: {
        id: {
          in: submissionsByWeekData.map((item: { assignmentId: string }) => item.assignmentId)
        }
      },
      select: {
        id: true,
        weekNumber: true,
      }
    });

    const submissionsByWeek = submissionsByWeekData.map((item: { assignmentId: string; _count: number }) => {
      const assignment = assignments.find((a: { id: string; weekNumber: number | null }) => a.id === item.assignmentId);
      return {
        weekNumber: assignment?.weekNumber || 0,
        count: item._count,
      };
    });

    const recentActivity = await this.getRecentActivity();

    return {
      totalAssignments,
      totalStudents,
      totalTeachers,
      totalSubmissions,
      averageScore: Number(avgScore._avg.score || 0),
      completionRate: totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0,
      assignmentsByLevel,
      submissionsByWeek,
      recentActivity,
    };
  }

  private async getRecentActivity(): Promise<DashboardStats['recentActivity']> {
    const recentAssignments = await prisma.assignment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const activity = [
      ...recentAssignments.map((assignment: { title: string; teacher: { user: { name: string } }; createdAt: Date }) => ({
        type: 'assignment_created' as const,
        title: assignment.title,
        user: assignment.teacher.user.name,
        timestamp: assignment.createdAt,
      })),
      ...recentSubmissions.map((submission) => ({
        type: 'submission' as const,
        title: `Teslim: ${submission.student?.user.name ?? 'Bilinmeyen'}`,
        user: submission.student?.user.name ?? 'Bilinmeyen',
        timestamp: submission.submittedAt,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return activity;
  }

  async getStudentProgress(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: {
        class: {
          include: {
            level: true,
          },
        },
        submissions: {
          include: {
            assignment: {
              include: {
                level: true,
              },
            },
            evaluation: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const totalAssignments = await prisma.assignment.count({
      where: {
        levelId: student.class.levelId,
        isDraft: false,
      },
    });

    const submittedAssignments = student.submissions.length;
    const evaluatedAssignments = student.submissions.filter((s: { evaluation: unknown } | null) => s?.evaluation);

    return {
      student,
      totalAssignments,
      submittedAssignments,
      evaluatedAssignments,
      averageScore: evaluatedAssignments.length > 0
        ? evaluatedAssignments.reduce((sum: number, s) => sum + Number(Number((s as { evaluation?: { score?: unknown } | null })?.evaluation?.score ?? 0)), 0) / evaluatedAssignments.length
        : 0,
      completionRate: totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0,
    };
  }

  /** Yönetim: Tüm öğrencilerin ödev teslim durumu (ADMIN) */
  async getAllStudentsProgress(): Promise<Array<{
    studentId: string;
    name: string;
    email: string;
    className: string;
    levelName: string;
    totalAssignments: number;
    submittedAssignments: number;
    completionRate: number;
  }>> {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
        class: {
          include: {
            level: { select: { name: true, id: true } },
          },
        },
        submissions: { select: { id: true } },
      },
    });

    const levelIds = [...new Set(students.map((s) => s.class?.levelId).filter(Boolean))] as string[];
    const countsByLevel = await Promise.all(
      levelIds.map(async (levelId) => {
        const count = await prisma.assignment.count({
          where: { levelId, isDraft: false },
        });
        return { levelId, count };
      })
    );
    const totalByLevel = Object.fromEntries(countsByLevel.map((c) => [c.levelId, c.count]));

    return students.map((s) => {
      const levelId = s.class?.levelId;
      const totalAssignments = levelId ? totalByLevel[levelId] ?? 0 : 0;
      const submittedAssignments = s.submissions.length;
      const completionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0;
      return {
        studentId: s.id,
        name: s.user.name,
        email: s.user.email,
        className: s.class?.name ?? '—',
        levelName: s.class?.level?.name ?? '—',
        totalAssignments,
        submittedAssignments,
        completionRate,
      };
    });
  }

  async getTeacherPerformance(userIdOrTeacherId: string, directTeacherId?: string) {
    let teacherId: string;
    if (directTeacherId) {
      teacherId = directTeacherId;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: userIdOrTeacherId },
      });
      if (!teacher) throw new Error('Teacher not found');
      teacherId = teacher.id;
    }
    const assignments = await prisma.assignment.findMany({
      where: { createdBy: teacherId },
      include: {
        level: true,
        submissions: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            evaluation: true,
          },
        },
      },
    });

    const totalSubmissions = assignments.reduce((sum: number, a: { submissions: unknown[] }) => sum + a.submissions.length, 0);
    const evaluatedSubmissions = assignments.reduce((sum: number, a: { submissions: Array<{ evaluation: unknown } | null> }) =>
      sum + a.submissions.filter((s: { evaluation: unknown } | null) => s?.evaluation).length, 0
    );

    const totalScore = assignments.reduce((sum: number, a) => {
      const subs = a.submissions.filter((s) => s?.evaluation);
      const score = subs.reduce((acc: number, sub) => acc + Number(Number((sub as { evaluation?: { score?: unknown } }).evaluation?.score ?? 0)), 0);
      return sum + score;
    }, 0);

    return {
      assignments,
      totalSubmissions,
      evaluatedSubmissions,
      averageScore: evaluatedSubmissions > 0 ? totalScore / evaluatedSubmissions : 0,
    };
  }

  /** Yönetim: Hoca iş yükü – kim kaç ödev vermiş, geri bildirim süresi */
  async getTeacherWorkload(): Promise<Array<{
    teacherId: string;
    teacherName: string;
    assignmentCount: number;
    submissionCount: number;
    evaluatedCount: number;
    evaluatedWithin24h: number;
    lastEvaluationAt: Date | null;
  }>> {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { name: true } },
        assignments: {
          include: {
            submissions: {
              include: {
                evaluation: true,
              },
            },
          },
        },
      },
    });

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return teachers.map((t) => {
      let submissionCount = 0;
      let evaluatedCount = 0;
      let evaluatedWithin24h = 0;
      let lastEvalAt: Date | null = null;
      for (const a of t.assignments) {
        for (const s of a.submissions) {
          submissionCount++;
          if (s.evaluation) {
            evaluatedCount++;
            const evalTime = new Date(s.evaluation.createdAt).getTime();
            if (now - evalTime <= dayMs) evaluatedWithin24h++;
            if (!lastEvalAt || evalTime > lastEvalAt.getTime()) lastEvalAt = new Date(s.evaluation.createdAt);
          }
        }
      }
      return {
        teacherId: t.id,
        teacherName: t.user.name,
        assignmentCount: t.assignments.length,
        submissionCount,
        evaluatedCount,
        evaluatedWithin24h,
        lastEvaluationAt: lastEvalAt,
      };
    });
  }

  /** Öğrenci portfolyosu (kur geçmişi): notlar, devamsızlık, hoca geri bildirimleri */
  async getStudentPortfolio(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        class: { include: { level: true } },
        skillScore: true,
        submissions: {
          include: {
            assignment: { select: { title: true, weekNumber: true } },
            evaluation: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
    if (!student) throw new Error('Student not found');

    const evaluations = student.submissions
      .filter((s) => s.evaluation)
      .map((s) => ({
        assignmentTitle: s.assignment.title,
        weekNumber: s.assignment.weekNumber,
        score: s.evaluation ? Number(s.evaluation.score) : null,
        feedback: s.evaluation?.feedback ?? null,
        submittedAt: s.submittedAt,
        evaluatedAt: s.evaluation?.createdAt ?? null,
      }));

    const totalAssignments = await prisma.assignment.count({
      where: {
        levelId: student.class.levelId,
        isDraft: false,
      },
    });
    const submittedCount = student.submissions.length;
    const evaluatedCount = evaluations.length;
    const avgScore = evaluatedCount > 0
      ? evaluations.reduce((s, e) => s + (e.score ?? 0), 0) / evaluatedCount
      : null;

    const sessionIds = await prisma.attendanceSession.findMany({
      where: { classId: student.classId },
      select: { id: true },
    }).then((s) => s.map((x) => x.id));
    const attendedCount = await prisma.attendanceRecord.count({
      where: {
        sessionId: { in: sessionIds },
        studentId: student.id,
        locationOk: true,
      },
    });
    const totalSessions = sessionIds.length;
    const attendanceRate = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 100;
    const absenceRate = 100 - attendanceRate;

    const fallbackScore = Math.min(100, Math.max(0, Math.round(avgScore ?? 50)));
    const skillScores = student.skillScore
      ? {
          vocabulary: Math.min(100, Math.max(0, student.skillScore.vocabulary)),
          grammar: Math.min(100, Math.max(0, student.skillScore.grammar)),
          listening: Math.min(100, Math.max(0, student.skillScore.listening)),
          speaking: Math.min(100, Math.max(0, student.skillScore.speaking)),
        }
      : {
          vocabulary: fallbackScore,
          grammar: fallbackScore,
          listening: fallbackScore,
          speaking: fallbackScore,
        };

    return {
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        class: student.class.name,
        level: student.class.level?.name ?? '—',
      },
      evaluations,
      summary: {
        totalAssignments,
        submittedCount,
        evaluatedCount,
        averageScore: avgScore != null ? Math.round(avgScore * 100) / 100 : null,
        totalSessions,
        attendedSessions: attendedCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        absenceRate: Math.round(absenceRate * 100) / 100,
      },
      skillScores,
    };
  }

  /** Sınıf rekabeti: ödev tamamlama + yoklama oranına göre sıralı sınıf listesi. */
  async getClassLeaderboard() {
    const classes = await prisma.class.findMany({
      include: {
        level: { select: { name: true } },
        students: { include: { submissions: true, attendanceRecords: true } },
      },
    });
    const now = new Date();
    const result: Array<{
      classId: string;
      className: string;
      levelName: string;
      studentCount: number;
      completionRate: number;
      attendanceRate: number;
      score: number;
    }> = [];

    for (const c of classes) {
      const levelId = c.levelId;
      const studentIds = c.students.map((s) => s.id);
      const totalAssignments = await prisma.assignment.count({
        where: {
          levelId,
          isDraft: false,
          dueDate: { lt: now },
          OR: [
            { targets: { none: {} } },
            { targets: { some: { classId: c.id } } },
            { targets: { some: { studentId: { in: studentIds } } } },
          ],
        },
      });
      const totalSubmissions = c.students.reduce(
        (sum, s) => sum + s.submissions.filter((sub) => sub.studentId === s.id).length,
        0
      );
      const completionRate = totalAssignments > 0 ? (totalSubmissions / (totalAssignments * Math.max(c.students.length, 1))) * 100 : 0;

      const totalSessions = await prisma.attendanceSession.count({
        where: { classId: c.id },
      });
      const totalPossible = totalSessions * Math.max(c.students.length, 1);
      const attended = c.students.reduce((sum, s) => sum + s.attendanceRecords.length, 0);
      const attendanceRate = totalPossible > 0 ? (attended / totalPossible) * 100 : 0;

      const score = Math.round(completionRate * 0.6 + attendanceRate * 0.4);
      result.push({
        classId: c.id,
        className: c.name,
        levelName: c.level?.name ?? '—',
        studentCount: c.students.length,
        completionRate: Math.round(completionRate * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        score,
      });
    }
    result.sort((a, b) => b.score - a.score);
    return result;
  }
}
