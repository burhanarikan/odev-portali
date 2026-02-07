import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { put, del } from '@vercel/blob';
import { errorHandler, AppError } from '../middleware/errorHandler';

export const uploadToBlob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file as Express.Multer.File & { buffer?: Buffer };
    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'Dosya yüklenmedi veya geçersiz.' });
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({
        error: 'Dosya depolama yapılandırılmamış. BLOB_READ_WRITE_TOKEN tanımlayın (Vercel Blob).',
      });
    }
    const ext = file.originalname ? path.extname(file.originalname) : '';
    const prefix = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pathname = ext ? `${prefix}${ext}` : prefix;
    const blob = await put(pathname, file.buffer, {
      access: 'public',
      contentType: file.mimetype || undefined,
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
