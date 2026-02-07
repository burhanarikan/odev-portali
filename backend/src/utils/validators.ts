import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  classId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const dateString = z.string().min(1).transform((s) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Geçersiz tarih');
  return d.toISOString();
});

const homeworkTypeEnum = z.enum(['TEXT', 'FILE', 'AUDIO', 'MIXED']);

/** Hocanın oluşturduğu taslak (Homework) alanları */
export const homeworkSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: homeworkTypeEnum.default('TEXT'),
  fileUrl: z.string().url().optional().or(z.literal('')),
  audioUrl: z.string().url().optional().or(z.literal('')),
  levelId: z.string().uuid('Geçersiz seviye ID'),
  weekNumber: z.number().int().min(1).max(16),
});

const assignmentFields = z.object({
  homeworkId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  levelId: z.string().uuid().optional(),
  weekNumber: z.number().int().min(1).max(16).optional(),
  startDate: dateString,
  dueDate: dateString,
  isDraft: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
  classId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
  homeworkType: homeworkTypeEnum.optional(),
  homeworkInstructions: z.string().optional(),
  homeworkFileUrl: z.string().optional(),
  homeworkAudioUrl: z.string().optional(),
  peerReviewEnabled: z.boolean().optional(),
  peerReviewsPerStudent: z.number().int().min(1).max(5).optional(),
});

export const assignmentSchema = assignmentFields
  .refine(
    (d) => d.homeworkId || (d.title && d.levelId && d.weekNumber != null),
    { message: 'homeworkId verin veya title, levelId ve weekNumber verin' }
  )
  .refine(
    (d) => {
      const start = new Date(d.startDate);
      const due = new Date(d.dueDate);
      return start.getTime() < due.getTime();
    },
    { message: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır.' }
  );

export const assignmentUpdateSchema = assignmentFields.partial().refine(
  (d) => {
    if (!d.startDate || !d.dueDate) return true;
    return new Date(d.startDate).getTime() < new Date(d.dueDate).getTime();
  },
  { message: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır.' }
);

export const submissionSchema = z
  .object({
    assignmentId: z.string().uuid('Geçersiz ödev kimliği'),
    contentText: z.string().optional(),
    attachments: z.array(z.string()).default([]),
    audioUrl: z.string().url().optional().or(z.literal('')),
    fileUrl: z.string().url().optional().or(z.literal('')),
  })
  .refine(
    (d) => {
      const hasText = (d.contentText ?? '').trim().length > 0;
      const hasAttachments = (d.attachments ?? []).length > 0;
      const hasAudio = !!d.audioUrl && d.audioUrl !== '';
      const hasFile = !!d.fileUrl && d.fileUrl !== '';
      return hasText || hasAttachments || hasAudio || hasFile;
    },
    { message: 'En az bir teslim içeriği gerekli: metin, dosya veya ses kaydı ekleyin.' }
  );

export const evaluationSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  accepted: z.boolean().default(false),
  annotationData: z.record(z.unknown()).optional(),
});

export const peerReviewSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.number().min(1).max(10),
  criteriaScores: z.record(z.string(), z.number().min(1).max(10)).optional(),
  feedback: z.string().max(2000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type HomeworkInput = z.infer<typeof homeworkSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
export type EvaluationInput = z.infer<typeof evaluationSchema>;
export type PeerReviewInput = z.infer<typeof peerReviewSchema>;
