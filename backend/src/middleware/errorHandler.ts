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

  // #region agent log
  if (statusCode === 500) {
    fetch('http://127.0.0.1:7242/ingest/33b73e8a-9feb-4e60-88ab-976de39f9176',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hypothesisId:'H5',location:'errorHandler.ts:500',message:'500 response',data:{statusCode,message:message.substring(0,200),errName:(err as Error).name},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion

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
