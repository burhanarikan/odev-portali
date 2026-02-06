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

    const assignmentsByLevel = await prisma.assignment.groupBy({
      by: ['levelId'],
      _count: true,
      include: {
        level: true,
      },
    });

    const submissionsByWeek = await prisma.submission.groupBy({
      by: ['assignmentId'],
      _count: true,
      include: {
        assignment: {
          select: {
            weekNumber: true,
          },
        },
      },
    });

    const recentActivity = await this.getRecentActivity();

    return {
      totalAssignments,
      totalStudents,
      totalTeachers,
      totalSubmissions,
      averageScore: avgScore._avg.score || 0,
      completionRate: totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0,
      assignmentsByLevel: assignmentsByLevel.map(item => ({
        levelName: item.level.name,
        count: item._count,
      })),
      submissionsByWeek: submissionsByWeek.map(item => ({
        weekNumber: item.assignment.weekNumber,
        count: item._count,
      })),
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
      ...recentAssignments.map(assignment => ({
        type: 'assignment_created' as const,
        title: assignment.title,
        user: assignment.teacher.user.name,
        timestamp: assignment.createdAt,
      })),
      ...recentSubmissions.map(submission => ({
        type: 'submission' as const,
        title: `Teslim: ${submission.student.user.name}`,
        user: submission.student.user.name,
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
    const evaluatedAssignments = student.submissions.filter(s => s.evaluation);

    return {
      student,
      totalAssignments,
      submittedAssignments,
      evaluatedAssignments,
      averageScore: evaluatedAssignments.length > 0 
        ? evaluatedAssignments.reduce((sum, s) => sum + (s.evaluation?.score || 0), 0) / evaluatedAssignments.length 
        : 0,
      completionRate: totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0,
    };
  }

  async getTeacherPerformance(teacherId: string) {
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

    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const evaluatedSubmissions = assignments.reduce((sum, a) => 
      sum + a.submissions.filter(s => s.evaluation).length, 0
    );

    return {
      assignments,
      totalSubmissions,
      evaluatedSubmissions,
      averageScore: evaluatedSubmissions > 0 
        ? evaluatedSubmissions.reduce((sum, s) => sum + s.submissions.find(sub => sub.evaluation?.evaluation?.score || 0, 0) / evaluatedSubmissions.length
        : 0,
    };
  }
}
