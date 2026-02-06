import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../utils/validators';
import { errorHandler } from '../middleware/errorHandler';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    res.json(result);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await authService.getProfile(userId);
    res.json(user);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};
