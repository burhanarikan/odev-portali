import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seviyeleri oluştur
  const levelA1 = await prisma.level.upsert({
    where: { name: 'A1' },
    update: {},
    create: { name: 'A1', sortOrder: 1 },
  });

  const levelA2 = await prisma.level.upsert({
    where: { name: 'A2' },
    update: {},
    create: { name: 'A2', sortOrder: 2 },
  });

  const levelB1 = await prisma.level.upsert({
    where: { name: 'B1' },
    update: {},
    create: { name: 'B1', sortOrder: 3 },
  });

  const levelB2 = await prisma.level.upsert({
    where: { name: 'B2' },
    update: {},
    create: { name: 'B2', sortOrder: 4 },
  });

  // Sınıfları oluştur
  const classA1A = await prisma.class.upsert({
    where: { name_levelId: { name: 'A', levelId: levelA1.id } },
    update: {},
    create: { name: 'A', levelId: levelA1.id },
  });

  const classA1B = await prisma.class.upsert({
    where: { name_levelId: { name: 'B', levelId: levelA1.id } },
    update: {},
    create: { name: 'B', levelId: levelA1.id },
  });

  const classA2A = await prisma.class.upsert({
    where: { name_levelId: { name: 'A', levelId: levelA2.id } },
    update: {},
    create: { name: 'A', levelId: levelA2.id },
  });

  // Öğrenciyi sınıfa ata
  const studentUser = await prisma.user.findUnique({
    where: { email: 'student@test.com' },
  });

  if (studentUser) {
    await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: { classId: classA1A.id },
      create: {
        userId: studentUser.id,
        classId: classA1A.id,
      },
    });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
