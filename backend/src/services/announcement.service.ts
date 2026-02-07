import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class AnnouncementService {
  async list(limit = 50) {
    return prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async create(title: string, body: string, authorId: string | null) {
    return prisma.announcement.create({
      data: { title, body, authorId: authorId || null },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string, callerUserId: string, callerRole: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw createError('Announcement not found', 404);
    if (callerRole !== 'ADMIN' && announcement.authorId !== callerUserId) {
      throw createError('Not authorized to delete this announcement', 403);
    }
    return prisma.announcement.delete({ where: { id } });
  }
}
