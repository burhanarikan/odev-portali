import { prisma } from '../config/database';
import { AssignmentInput } from '../utils/validators';
import { SimilarityService, SimilarAssignment } from './similarity.service';
import { createError } from '../middleware/errorHandler';

export class AssignmentService {
  private similarityService = new SimilarityService();

  async createAssignment(data: AssignmentInput, teacherId: string) {
    // Teacher record'unu bul
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    // Ödevi oluştur (similarity check'i tamamen kaldır)
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || '',
        levelId: data.levelId,
        weekNumber: data.weekNumber,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        createdBy: teacher.id, // Teacher ID'yi kullan
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

    return {
      assignment,
      similarAssignments: [], // Boş dizi
    };
  }

  async getAssignments(teacherId?: string) {
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

  async updateAssignment(id: string, data: Partial<AssignmentInput>, teacherId: string) {
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

  async deleteAssignment(id: string, teacherId: string) {
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

  async getAssignmentsByWeek(weekNumber: number, teacherId?: string) {
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
