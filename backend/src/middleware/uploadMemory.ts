import { Request } from 'express';
import multer from 'multer';
import path from 'path';

const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|webm|ogg|mp3|m4a|wav|mp4/;

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeOk = /^(image|application\/pdf|audio|video|text)/.test(file.mimetype) || file.mimetype === 'application/octet-stream';
  if (allowedTypes.test(ext) || mimeOk) {
    return cb(null, true);
  }
  cb(new Error('Desteklenmeyen dosya türü. PDF, resim, ses (webm/ogg/mp3/m4a) yükleyebilirsiniz.'));
};

const storage = multer.memoryStorage();
const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || '52428800', 10); // 50MB default for audio

export const uploadMemory = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter,
});

export const uploadSingleMemory = (fieldName: string) => uploadMemory.single(fieldName);
export const uploadMultipleMemory = (fieldName: string, maxCount: number = 5) => uploadMemory.array(fieldName, maxCount);
