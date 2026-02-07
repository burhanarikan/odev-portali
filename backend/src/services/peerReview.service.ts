import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

const DEFAULT_MAX_REVIEWS = 2;

export class PeerReviewService {
  /** Öğrencinin değerlendirmesi gereken (anonim) teslimleri döndürür. Kendi teslimi ve zaten puanladıkları hariç. */
  async getSubmissionsToReview(assignmentId: string, studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { class: true },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { level: true },
    });
    if (!assignment) throw createError('Ödev bulunamadı', 404);
    if (!assignment.peerReviewEnabled) throw createError('Bu ödevde akran değerlendirmesi kapalı', 400);
    if (assignment.levelId !== student.class.levelId) throw createError('Bu ödev sizin seviyenize ait değil', 403);

    const alreadyReviewedIds = await prisma.peerReview.findMany({
      where: { reviewerStudentId: student.id },
      select: { submissionId: true },
    }).then((r) => r.map((x) => x.submissionId));

    const mySubmission = await prisma.submission.findFirst({
      where: { assignmentId, studentId: student.id },
      select: { id: true },
    });

    const limit = Math.min(assignment.peerReviewsPerStudent ?? DEFAULT_MAX_REVIEWS, 5);
    const candidates = await prisma.submission.findMany({
      where: {
        assignmentId,
        studentId: { not: null },
        id: {
          notIn: [...alreadyReviewedIds, ...(mySubmission ? [mySubmission.id] : [])],
        },
      },
      take: limit * 3,
      orderBy: { submittedAt: 'asc' },
      select: {
        id: true,
        contentText: true,
        submittedAt: true,
        audioUrl: true,
        fileUrl: true,
      },
    });

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map((s) => ({
      submissionId: s.id,
      contentPreview: s.contentText ? s.contentText.slice(0, 300) + (s.contentText.length > 300 ? '…' : '') : null,
      submittedAt: s.submittedAt,
      hasAudio: !!s.audioUrl,
      hasFile: !!s.fileUrl,
    }));
  }

  /** Akran puanı gönder. score 1–5 veya 1–10 (tam sayı veya ondalık). */
  async submitPeerReview(
    submissionId: string,
    studentUserId: string,
    data: { score: number; criteriaScores?: Record<string, number>; feedback?: string }
  ) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });
    if (!submission) throw createError('Teslim bulunamadı', 404);
    if (!submission.assignment.peerReviewEnabled) throw createError('Bu ödevde akran değerlendirmesi kapalı', 400);
    if (submission.studentId === student.id) throw createError('Kendi tesliminizi puanlayamazsınız', 400);

    const score = Math.min(10, Math.max(1, Number(data.score)));
    const existing = await prisma.peerReview.findUnique({
      where: {
        submissionId_reviewerStudentId: { submissionId, reviewerStudentId: student.id },
      },
    });
    if (existing) throw createError('Bu teslimi zaten puanladınız', 409);

    return prisma.peerReview.create({
      data: {
        submissionId,
        reviewerStudentId: student.id,
        score,
        criteriaScores: data.criteriaScores ?? undefined,
        feedback: data.feedback?.trim() || null,
      },
    });
  }

  /** Bir teslime gelen akran puanları (anonim: sadece puan ve geri bildirim). Teslim sahibi veya hoca görebilir. */
  async getPeerReviewsReceived(submissionId: string, requesterUserId: string, requesterRole: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: true,
        peerReviews: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!submission) throw createError('Teslim bulunamadı', 404);

    const isOwner = submission.student?.userId === requesterUserId;
    const isTeacher = requesterRole === 'TEACHER' || requesterRole === 'ADMIN';
    if (!isOwner && !isTeacher) throw createError('Bu teslimin akran değerlendirmelerini görme yetkiniz yok', 403);

    return submission.peerReviews.map((r) => ({
      id: r.id,
      score: Number(r.score),
      criteriaScores: r.criteriaScores,
      feedback: r.feedback,
      createdAt: r.createdAt,
    }));
  }

  /** En adil puan verenler: hocanın puanı ile akran puanının sapması en düşük olan öğrenciler. */
  async getFairnessLeaderboard(limit = 10) {
    const reviewsWithTeacher = await prisma.peerReview.findMany({
      where: {
        submission: {
          evaluation: { score: { not: null } },
        },
      },
      include: {
        submission: {
          include: {
            evaluation: { select: { score: true } },
          },
        },
        reviewer: {
          include: {
            user: { select: { name: true } },
            class: { include: { level: { select: { name: true } } } },
          },
        },
      },
    });

    const byReviewer = new Map<string, { deviations: number[]; name: string; levelName: string }>();
    for (const r of reviewsWithTeacher) {
      const teacherScore = r.submission?.evaluation?.score != null ? Number(r.submission.evaluation.score) : null;
      if (teacherScore == null) continue;
      const peerScore = Number(r.score);
      const deviation = Math.abs(teacherScore - peerScore);
      const key = r.reviewerStudentId;
      if (!byReviewer.has(key)) {
        byReviewer.set(key, {
          deviations: [],
          name: r.reviewer.user.name,
          levelName: r.reviewer.class?.level?.name ?? '—',
        });
      }
      byReviewer.get(key)!.deviations.push(deviation);
    }

    const ranked = Array.from(byReviewer.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.name,
        levelName: data.levelName,
        reviewCount: data.deviations.length,
        averageDeviation: data.deviations.reduce((a, b) => a + b, 0) / data.deviations.length,
      }))
      .sort((a, b) => a.averageDeviation - b.averageDeviation)
      .slice(0, limit);

    return ranked;
  }

  /** Öğrencinin teslimlerine gelen akran değerlendirmeleri (anonim). */
  async getMyReceivedPeerReviews(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    const submissions = await prisma.submission.findMany({
      where: { studentId: student.id },
      include: {
        assignment: { select: { title: true, weekNumber: true, peerReviewEnabled: true } },
        peerReviews: { orderBy: { createdAt: 'desc' } },
      },
    });

    return submissions
      .filter((s) => s.assignment.peerReviewEnabled && s.peerReviews.length > 0)
      .map((s) => ({
        submissionId: s.id,
        assignmentTitle: s.assignment.title,
        weekNumber: s.assignment.weekNumber,
        reviews: s.peerReviews.map((r) => ({
          id: r.id,
          score: Number(r.score),
          criteriaScores: r.criteriaScores,
          feedback: r.feedback,
          createdAt: r.createdAt,
        })),
      }));
  }

  /** Öğrencinin verdiği akran puanları (hangi ödeve ne verdi, kendi listesi). */
  async getMyPeerReviews(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    return prisma.peerReview.findMany({
      where: { reviewerStudentId: student.id },
      include: {
        submission: {
          include: {
            assignment: { select: { title: true, weekNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
