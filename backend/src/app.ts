import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import analyticsRoutes from './routes/analytics.routes';
import uploadRoutes from './routes/upload.routes';
import attendanceRoutes from './routes/attendance.routes';
import announcementRoutes from './routes/announcement.routes';
import peerReviewRoutes from './routes/peerReview.routes';
import timelineRoutes from './routes/timeline.routes';
import teacherResourceRoutes from './routes/teacherResource.routes';
import errorBankRoutes from './routes/errorBank.routes';
import interventionRoutes from './routes/intervention.routes';
import teacherWikiRoutes from './routes/teacherWiki.routes';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '600', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  handler: (req, res) => {
    res.status(429).json({ error: 'Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin.' });
  },
});

app.use(helmet());
const localhostOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173'];
const corsOrigins = process.env.FRONTEND_URL
  ? [...process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean), ...localhostOrigins]
  : localhostOrigins;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    if (corsOrigins.some((o) => o === '*')) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (origin.endsWith('.onrender.com')) return cb(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dosya sunumu yok: yüklemeler Vercel Blob üzerinden (public URL). FS kullanımı Vercel serverless ile uyumlu değildir.

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/peer-review', peerReviewRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/teacher-resources', teacherResourceRoutes);
app.use('/api/error-bank', errorBankRoutes);
app.use('/api/intervention', interventionRoutes);
app.use('/api/teacher-wiki', teacherWikiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export { app };
