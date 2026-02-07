import api from './client';

export interface SubmissionToReview {
  submissionId: string;
  contentPreview: string | null;
  submittedAt: string;
  hasAudio: boolean;
  hasFile: boolean;
}

export interface PeerReviewReceived {
  id: string;
  score: number;
  criteriaScores: unknown;
  feedback: string | null;
  createdAt: string;
}

export interface MyReceivedPeerReviewGroup {
  submissionId: string;
  assignmentTitle: string;
  weekNumber: number;
  reviews: PeerReviewReceived[];
}

export interface FairnessLeaderboardEntry {
  studentId: string;
  studentName: string;
  levelName: string;
  reviewCount: number;
  averageDeviation: number;
}

export const peerReviewApi = {
  getSubmissionsToReview: async (assignmentId: string) => {
    const res = await api.get<SubmissionToReview[]>(
      `/peer-review/assignments/${assignmentId}/submissions-to-review`
    );
    return res.data;
  },

  submitPeerReview: async (data: {
    submissionId: string;
    score: number;
    criteriaScores?: Record<string, number>;
    feedback?: string;
  }) => {
    const res = await api.post('/peer-review/reviews', data);
    return res.data;
  },

  getPeerReviewsReceived: async (submissionId: string) => {
    const res = await api.get<PeerReviewReceived[]>(
      `/peer-review/submissions/${submissionId}/reviews`
    );
    return res.data;
  },

  getMyReceivedPeerReviews: async () => {
    const res = await api.get<MyReceivedPeerReviewGroup[]>('/peer-review/my-received-reviews');
    return res.data;
  },

  getMyPeerReviews: async () => {
    const res = await api.get<unknown[]>('/peer-review/my-reviews');
    return res.data;
  },

  getFairnessLeaderboard: async (limit = 10) => {
    const res = await api.get<FairnessLeaderboardEntry[]>(
      `/peer-review/fairness-leaderboard?limit=${limit}`
    );
    return res.data;
  },
};
