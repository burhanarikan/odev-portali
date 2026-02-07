import { Request, Response, NextFunction } from 'express';
import { PeerReviewService } from '../services/peerReview.service';
import { errorHandler, AppError } from '../middleware/errorHandler';
import { peerReviewSchema } from '../utils/validators';

const peerReviewService = new PeerReviewService();

export const getSubmissionsToReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const assignmentId = req.params.assignmentId ?? '';
    const list = await peerReviewService.getSubmissionsToReview(assignmentId, req.user.userId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const submitPeerReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const body = peerReviewSchema.parse(req.body);
    const review = await peerReviewService.submitPeerReview(
      body.submissionId,
      req.user.userId,
      {
        score: body.score,
        criteriaScores: body.criteriaScores,
        feedback: body.feedback,
      }
    );
    res.status(201).json(review);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getPeerReviewsReceived = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const submissionId = req.params.submissionId ?? '';
    const list = await peerReviewService.getPeerReviewsReceived(
      submissionId,
      req.user.userId,
      req.user.role
    );
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getMyReceivedPeerReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await peerReviewService.getMyReceivedPeerReviews(req.user.userId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getMyPeerReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await peerReviewService.getMyPeerReviews(req.user.userId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getFairnessLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(20, parseInt(String(req.query.limit), 10) || 10);
    const list = await peerReviewService.getFairnessLeaderboard(limit);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
