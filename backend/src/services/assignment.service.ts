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

    const levelId = data.levelId!;
    const weekNumber = data.weekNumber!;
    const title = (data.title ?? '').trim();
    const description = data.description ?? '';

    let homework: { id: string };

    if (data.homeworkId) {
      const existingHomework = await prisma.homework.findFirst({
        where: { id: data.homeworkId, teacherId: teacher.id },
      });
      if (!existingHomework) {
        throw createError('Taslak bulunamadı veya bu taslağa erişim yetkiniz yok.', 404);
      }
      homework = existingHomework;
    } else {
      if (!title || !levelId || weekNumber == null) {
        throw createError('Yeni ödev için title, levelId ve weekNumber gerekli.', 400);
      }
      const existing = await prisma.assignment.findFirst({
        where: {
          createdBy: teacher.id,
          levelId,
          title,
          weekNumber,
        },
      });
      if (existing) {
        throw createError('Bu seviye ve haftada aynı başlıkta bir ödeviniz zaten var. Başlığı değiştirin veya farklı hafta seçin.', 409);
      }
      const created = await prisma.homework.create({
        data: {
          teacherId: teacher.id,
          title,
          description: description || null,
          instructions: data.homeworkInstructions || null,
          type: data.homeworkType || 'TEXT',
          fileUrl: data.homeworkFileUrl || null,
          audioUrl: data.homeworkAudioUrl || null,
          levelId,
          weekNumber,
        },
      });
      homework = created;
    }

    const homeworkRecord = await prisma.homework.findUnique({
      where: { id: homework.id },
    });
    const assignTitle = homeworkRecord?.title ?? title;
    const assignDesc = homeworkRecord?.description ?? description;
    const assignLevelId = homeworkRecord?.levelId ?? levelId;
    const assignWeek = homeworkRecord?.weekNumber ?? weekNumber;

    const assignment = await prisma.assignment.create({
      data: {
        homeworkId: homework.id,
        title: assignTitle,
        description: assignDesc,
        levelId: assignLevelId,
        weekNumber: assignWeek,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        createdBy: teacher.id,
        attachments: JSON.stringify(data.attachments || []),
        isDraft: data.isDraft || false,
      },
      include: {
        homework: true,
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
        homework: true,
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
        homework: true,
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
