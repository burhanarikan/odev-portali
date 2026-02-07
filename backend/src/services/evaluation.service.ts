import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';
import { EvaluationInput } from '../utils/validators';
import { createError } from '../middleware/errorHandler';

export class EvaluationService {
  async submitEvaluation(submissionId: string, data: EvaluationInput, userId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw createError('Öğretmen bulunamadı', 404);
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { select: { createdBy: true } },
        evaluation: true,
      },
    });
    if (!submission) {
      throw createError('Teslim bulunamadı', 404);
    }
    if (submission.assignment.createdBy !== teacher.id) {
      throw createError('Bu teslime değerlendirme yapma yetkiniz yok', 403);
    }

    const payload = {
      score: data.score != null ? data.score : undefined,
      feedback: data.feedback ?? undefined,
      accepted: data.accepted ?? false,
      annotationData: data.annotationData ?? undefined,
    };

    const evaluation = await prisma.evaluation.upsert({
      where: { submissionId },
      create: {
        submissionId,
        teacherId: teacher.id,
        score: payload.score,
        feedback: payload.feedback,
        accepted: payload.accepted,
        annotationData: (payload.annotationData ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      update: {
        ...(payload.score !== undefined && { score: payload.score }),
        ...(payload.feedback !== undefined && { feedback: payload.feedback }),
        accepted: payload.accepted,
        ...(payload.annotationData !== undefined && {
          annotationData: payload.annotationData as Prisma.InputJsonValue,
        }),
      },
      include: {
        submission: {
          include: {
            assignment: { select: { id: true, title: true } },
            student: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
    return evaluation;
  }
}
