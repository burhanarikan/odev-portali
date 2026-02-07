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
  if (statusCode === 500) {
    const e = err as Error & { code?: string };
    console.error('[500] Detay:', e.message, e.code ? `(code: ${e.code})` : '');
  }

  // #region agent log
  // (removed external fetch to avoid side effects in production)
  // #endregion

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      error: message,
      stack: err.stack,
    });
  } else {
    // Production'da 500'de de gerçek mesajı döndür: "column X does not exist" gibi hatalar kullanıcının migration çalıştırmasını sağlar
    res.status(statusCode).json({
      error: message,
    });
  }
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
