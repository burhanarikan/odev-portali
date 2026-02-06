import { prisma } from '../config/database';
import { AssignmentInput } from '../utils/validators';
import { SimilarityService } from './similarity.service';
import { createError } from '../middleware/errorHandler';
import { TargetType } from '@prisma/client';

export class AssignmentService {
  private similarityService = new SimilarityService();

  async createAssignment(data: AssignmentInput, teacherId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    // Aynı öğretmen, aynı seviye ve aynı başlıkta ödev var mı? (tekrar ödev engelleme)
    const existing = await prisma.assignment.findFirst({
      where: {
        createdBy: teacher.id,
        levelId: data.levelId,
        title: data.title.trim(),
      },
    });
    if (existing) {
      throw createError('Bu seviyede aynı başlıkta bir ödev zaten mevcut. Başlığı değiştirin veya mevcut ödevi kullanın.', 409);
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || '',
        levelId: data.levelId,
        weekNumber: data.weekNumber,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        createdBy: teacher.id,
        attachments: JSON.stringify(data.attachments || []),
        isDraft: data.isDraft || false,
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    // Hedef: sadece belirli sınıf veya belirli öğrenciler
    if (data.classId) {
      await prisma.assignmentTarget.create({
        data: {
          assignmentId: assignment.id,
          targetType: TargetType.CLASS,
          classId: data.classId,
        },
      });
    } else if (data.studentIds && data.studentIds.length > 0) {
      for (const studentId of data.studentIds) {
        await prisma.assignmentTarget.create({
          data: {
            assignmentId: assignment.id,
            targetType: TargetType.STUDENT,
            studentId,
          },
        });
      }
    }
    // targets yoksa = tüm seviye (mevcut davranış)

    return {
      assignment,
      similarAssignments: [],
    };
  }

  private async resolveTeacherId(userId: string): Promise<string> {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw createError('Teacher not found', 404);
    return teacher.id;
  }

  async getSubmissionsForTeacher(teacherUserId: string) {
    const teacherId = await this.resolveTeacherId(teacherUserId);
    const submissions = await prisma.submission.findMany({
      where: {
        assignment: { createdBy: teacherId },
      },
      include: {
        assignment: {
          select: {
            title: true,
            level: { select: { name: true } },
          },
        },
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        evaluation: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    return submissions;
  }

  async getAssignments(teacherUserId?: string) {
    const teacherId = teacherUserId ? await this.resolveTeacherId(teacherUserId) : undefined;
    const where = teacherId ? { createdBy: teacherId } : {};
    return prisma.assignment.findMany({
      where,
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
        targets: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAssignmentById(id: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
        targets: {
          include: {
            class: {
              include: {
                level: true,
              },
            },
            student: {
              include: {
                user: true,
                class: {
                  include: {
                    level: true,
                  },
                },
              },
            },
            group: {
              include: {
                members: {
                  include: {
                    student: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            group: {
              include: {
                members: {
                  include: {
                    student: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
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

  async updateAssignment(id: string, data: Partial<AssignmentInput>, teacherUserId: string) {
    const teacherId = await this.resolveTeacherId(teacherUserId);
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    if (assignment.createdBy !== teacherId) {
      throw createError('Not authorized to update this assignment', 403);
    }

    return prisma.assignment.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async deleteAssignment(id: string, teacherUserId: string) {
    const teacherId = await this.resolveTeacherId(teacherUserId);
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    if (assignment.createdBy !== teacherId) {
      throw createError('Not authorized to delete this assignment', 403);
    }

    return prisma.assignment.delete({
      where: { id },
    });
  }

  async getAssignmentsByWeek(weekNumber: number, teacherUserId?: string) {
    const teacherId = teacherUserId ? await this.resolveTeacherId(teacherUserId) : undefined;
    const where = {
      weekNumber,
      ...(teacherId && { createdBy: teacherId }),
    };

    return prisma.assignment.findMany({
      where,
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  async getAssignmentsByLevel(levelId: string, teacherUserId?: string) {
    const teacherId = teacherUserId ? await this.resolveTeacherId(teacherUserId) : undefined;
    const where = {
      levelId,
      ...(teacherId && { createdBy: teacherId }),
    };

    return prisma.assignment.findMany({
      where,
      include: {
        level: true,
        teacher: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  async createGroup(assignmentId: string, name: string, teacherId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    return prisma.group.create({
      data: {
        assignmentId,
        name,
        createdBy: teacher.id,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        assignment: {
          include: {
            level: true,
          },
        },
      },
    });
  }

  async addStudentToGroup(groupId: string, studentId: string) {
    return prisma.groupMember.create({
      data: {
        groupId,
        studentId,
      },
      include: {
        group: {
          include: {
            assignment: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async removeStudentFromGroup(groupId: string, studentId: string) {
    return prisma.groupMember.delete({
      where: {
        groupId_studentId: {
          groupId,
          studentId,
        },
      },
    });
  }

  async getGroups(assignmentId: string) {
    return prisma.group.findMany({
      where: { assignmentId },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        members: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }
}
