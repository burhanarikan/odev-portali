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

export const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  levelId: z.string().uuid('Invalid level ID'),
  weekNumber: z.number().int().min(1).max(16),
  startDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  isDraft: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
});

export const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  contentText: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

export const evaluationSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  accepted: z.boolean().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
export type EvaluationInput = z.infer<typeof evaluationSchema>;
