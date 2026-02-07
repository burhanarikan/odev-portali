import { prisma } from '../config/database';
import { SubmissionInput } from '../utils/validators';
import { createError } from '../middleware/errorHandler';

export class StudentService {
  async getStudentAssignments(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: {
        class: {
          include: {
            level: true,
          },
        },
      },
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    const now = new Date();
    // Ödevler: aynı seviye ve (hedef yok = tüm seviye VEYA hedefte bu sınıf/öğrenci var)
    const assignments = await prisma.assignment.findMany({
      where: {
        levelId: student.class.levelId,
        isDraft: false,
        OR: [
          { targets: { none: {} } },
          { targets: { some: { classId: student.classId } } },
          { targets: { some: { studentId: student.id } } },
        ],
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
        submissions: {
          where: {
            studentId: student.id,
          },
          include: {
            evaluation: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    type AssignmentWithSubmissions = { startDate: Date; dueDate: Date; submissions: unknown[] };
    const active = assignments.filter((a: AssignmentWithSubmissions) =>
      a.startDate <= now && a.dueDate >= now &&
      a.submissions.length === 0
    );

    const upcoming = assignments.filter((a: AssignmentWithSubmissions) =>
      a.startDate > now && a.submissions.length === 0
    );

    const past = assignments.filter((a: AssignmentWithSubmissions) =>
      a.dueDate < now || a.submissions.length > 0
    );

    return {
      active,
      upcoming,
      past,
    };
  }

  async getAssignmentById(id: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: {
        class: {
          include: {
            level: true,
          },
        },
      },
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        levelId: student.class.levelId,
        isDraft: false,
        OR: [
          { targets: { none: {} } },
          { targets: { some: { classId: student.classId } } },
          { targets: { some: { studentId: student.id } } },
        ],
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
        submissions: {
          where: {
            studentId: student.id,
          },
          include: {
            evaluation: true,
          },
        },
      },
    });

    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    return assignment;
  }

  async getConsent(userId: string): Promise<{ accepted: boolean; acceptedAt?: Date }> {
    const consent = await prisma.userConsent.findUnique({
      where: { userId },
    });
    return consent ? { accepted: true, acceptedAt: consent.acceptedAt } : { accepted: false };
  }

  async recordConsent(userId: string) {
    return prisma.userConsent.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async submitAssignment(data: SubmissionInput, studentId: string) {
    const consent = await this.getConsent(studentId);
    if (!consent.accepted) {
      throw createError(
        'Ödev teslim edebilmek için lütfen önce KVKK ve kurum kurallarını kabul edin. Profil veya ana sayfadaki onay kutusunu işaretleyin.',
        403
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
    });

    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: data.assignmentId,
        studentId: student.id,
      },
    });

    if (existingSubmission) {
      throw createError('Assignment already submitted', 409);
    }

    const now = new Date();
    const isLate = assignment.dueDate < now;

    return prisma.submission.create({
      data: {
        assignmentId: data.assignmentId,
        studentId: student.id,
        contentText: data.contentText,
        attachments: JSON.stringify(data.attachments || []),
        audioUrl: data.audioUrl || null,
        fileUrl: data.fileUrl || null,
        isLate,
      },
      include: {
        assignment: {
          include: {
            level: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getSubmission(assignmentId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    const submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
      include: {
        assignment: {
          include: {
            level: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        evaluation: true,
      },
    });

    if (!submission) {
      throw createError('Submission not found', 404);
    }

    return submission;
  }

  async getEvaluations(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    return prisma.submission.findMany({
      where: {
        studentId: student.id,
        evaluation: { isNot: null },
      },
      include: {
        assignment: {
          include: {
            level: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        evaluation: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }
}
