/**
 * Mevcut Assignment kayıtları için Homework oluşturur ve assignment.homeworkId atar.
 * Migration sonrası bir kez çalıştırın: npx tsx prisma/backfill-homework.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.assignment.findMany({
    where: { homeworkId: null },
    select: { id: true, title: true, description: true, levelId: true, weekNumber: true, createdBy: true },
  });
  console.log(`homeworkId olmayan ${assignments.length} ödev bulundu.`);
  for (const a of assignments) {
    const homework = await prisma.homework.create({
      data: {
        teacherId: a.createdBy,
        title: a.title,
        description: a.description,
        levelId: a.levelId,
        weekNumber: a.weekNumber,
      },
    });
    await prisma.assignment.update({
      where: { id: a.id },
      data: { homeworkId: homework.id },
    });
    console.log(`  Assignment ${a.id} -> Homework ${homework.id}`);
  }
  console.log('Backfill tamamlandı.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
