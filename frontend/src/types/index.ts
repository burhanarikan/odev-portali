export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
  student?: Student;
  teacher?: Teacher;
}

export interface Student {
  id: string;
  userId: string;
  classId: string;
  enrollmentDate: string;
  createdAt: string;
  class: Class;
}

export interface Teacher {
  id: string;
  userId: string;
  createdAt: string;
}

export interface Level {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export type HomeworkType = 'TEXT' | 'FILE' | 'AUDIO' | 'MIXED';

export interface Class {
  id: string;
  name: string;
  levelId: string;
  createdAt: string;
  level: Level;
}

export interface Assignment {
  id: string;
  homeworkId?: string | null;
  title: string;
  description?: string;
  levelId: string;
  weekNumber: number;
  createdBy: string;
  startDate: string;
  dueDate: string;
  isDraft: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  level: Level;
  teacher: {
    id: string;
    user: User;
  };
  homework?: {
    id: string;
    title: string;
    teacherId: string;
    type?: HomeworkType;
    instructions?: string | null;
    fileUrl?: string | null;
    audioUrl?: string | null;
  } | null;
  targets?: AssignmentTarget[];
  submissions?: Submission[];
  _count?: {
    submissions: number;
  };
}

export interface AssignmentTarget {
  id: string;
  assignmentId: string;
  targetType: 'CLASS' | 'STUDENT' | 'GROUP';
  classId?: string;
  studentId?: string;
  groupId?: string;
  createdAt: string;
  class?: Class;
  student?: {
    id: string;
    user: User;
    class: Class;
  };
  group?: Group;
}

export interface Group {
  id: string;
  assignmentId: string;
  name?: string;
  createdBy: string;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  groupId: string;
  studentId: string;
  joinedAt: string;
  student: {
    id: string;
    user: User;
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId?: string;
  groupId?: string;
  submittedAt: string;
  isLate: boolean;
  contentText?: string;
  attachments: string[];
  audioUrl?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  assignment: Assignment;
  student?: {
    id: string;
    user: User;
  };
  group?: Group;
  evaluation?: Evaluation;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  teacherId: string;
  score?: number;
  feedback?: string;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SimilarAssignment {
  id: string;
  title: string;
  description?: string | null;
  teacherName: string;
  levelName: string;
  weekNumber: number;
  similarityScore: number;
  /** Örn: "Tüm seviye" veya "A Sınıfı" veya "Öğrenci: X, Y" */
  targetsSummary?: string;
  /** Eşleşen kelimeler (neden benzer) */
  matchedWords?: string[];
}

export interface StudentAssignments {
  active: Assignment[];
  upcoming: Assignment[];
  past: Assignment[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface CreateAssignmentResponse {
  assignment: Assignment;
  similarAssignments: SimilarAssignment[];
}
