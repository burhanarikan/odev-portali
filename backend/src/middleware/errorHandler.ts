import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err.name === 'ZodError') {
    statusCode = 400;
    const zodErr = err as ZodError;
    message = zodErr.errors.map((e) => e.message).join('; ') || 'Validation error';
  } else {
    statusCode = (err as AppError).statusCode || 500;
    message = err.message || 'Internal Server Error';
  }

  console.error(`Error ${statusCode}: ${message}`);
  if (err.stack) console.error(err.stack);

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      error: message,
      stack: err.stack,
    });
  } else {
    res.status(statusCode).json({
      error: statusCode === 500 ? 'Internal Server Error' : message,
    });
  }
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
