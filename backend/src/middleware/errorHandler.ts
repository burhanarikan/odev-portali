import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/** Prisma hata kodları -> HTTP status (Render/Vercel loglarında gerçek hatayı görmek için 500'lerde mesaj loglanır) */
function statusFromPrismaCode(code: string): number | null {
  switch (code) {
    case 'P2025': return 404; // Kayıt bulunamadı
    case 'P2002': return 409; // Unique constraint
    case 'P2003': return 400; // Foreign key
    case 'P1001':
    case 'P1002':
    case 'P1017': return 503; // DB bağlantı hatası
    case 'P1014':
    case 'P2021': return 503; // Tablo/relation yok (migration çalıştırılmamış olabilir)
    default: return null;
  }
}

export const errorHandler = (
  err: AppError | ZodError & { code?: string },
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
    const prismaCode = typeof (err as { code?: string }).code === 'string' ? (err as { code: string }).code : null;
    const prismaStatus = prismaCode ? statusFromPrismaCode(prismaCode) : null;
    if (prismaStatus != null) {
      statusCode = prismaStatus;
      message = (err as Error).message || 'Internal Server Error';
    } else {
      statusCode = (err as AppError).statusCode ?? 500;
      message = (err as Error).message || 'Internal Server Error';
    }
  }

  console.error(`Error ${statusCode}: ${message}`);
  if (err.stack) console.error(err.stack);
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    console.error('[500] Detay (Render loglarında kontrol edin):', (err as Error).message);
  }

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
