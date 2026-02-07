import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { put, del } from '@vercel/blob';
import { errorHandler, AppError } from '../middleware/errorHandler';

/** Vercel serverless uyumlu: multipart (buffer) veya JSON base64 kabul eder. */
export const uploadToBlob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let buffer: Buffer;
    let contentType: string | undefined;
    let originalName: string;

    const file = req.file as Express.Multer.File & { buffer?: Buffer };
    if (file?.buffer) {
      buffer = file.buffer;
      contentType = file.mimetype;
      originalName = file.originalname || 'file';
    } else {
      const body = req.body as { base64?: string; filename?: string; contentType?: string };
      const base64 = typeof body?.base64 === 'string' ? body.base64 : null;
      if (!base64) {
        return res.status(400).json({ error: 'Dosya yüklenmedi veya geçersiz. Multipart "file" veya JSON { base64, filename } gönderin.' });
      }
      buffer = Buffer.from(base64, 'base64');
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'Geçersiz base64 veri.' });
      }
      originalName = typeof body.filename === 'string' ? body.filename : 'file';
      contentType = typeof body.contentType === 'string' ? body.contentType : undefined;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({
        error: 'Dosya depolama yapılandırılmamış. BLOB_READ_WRITE_TOKEN tanımlayın (Vercel Blob).',
      });
    }
    const ext = originalName ? path.extname(originalName) : '';
    const prefix = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pathname = ext ? `${prefix}${ext}` : prefix;
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: contentType || undefined,
      token,
    });
    res.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    errorHandler(err as AppError, req, res, next);
  }
};

export const deleteFromBlob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url gerekli' });
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({ error: 'Blob token yapılandırılmamış.' });
    }
    await del(url, { token });
    res.json({ deleted: true });
  } catch (err) {
    errorHandler(err as AppError, req, res, next);
  }
};
