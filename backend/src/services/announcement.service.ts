import { prisma } from '../config/database';

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

  async delete(id: string) {
    return prisma.announcement.delete({ where: { id } });
  }
}
