import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

async function main() {
  // --- Seviyeler (Dil okulu: A1–B2) ---
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

  // --- Sınıflar (101, 102) ---
  const classA1_101 = await prisma.class.upsert({
    where: { name_levelId: { name: '101', levelId: levelA1.id } },
    update: {},
    create: { name: '101', levelId: levelA1.id },
  });
  const classA1_102 = await prisma.class.upsert({
    where: { name_levelId: { name: '102', levelId: levelA1.id } },
    update: {},
    create: { name: '102', levelId: levelA1.id },
  });
  const classA2_101 = await prisma.class.upsert({
    where: { name_levelId: { name: '101', levelId: levelA2.id } },
    update: {},
    create: { name: '101', levelId: levelA2.id },
  });
  const classA2_102 = await prisma.class.upsert({
    where: { name_levelId: { name: '102', levelId: levelA2.id } },
    update: {},
    create: { name: '102', levelId: levelA2.id },
  });
  const classB1_101 = await prisma.class.upsert({
    where: { name_levelId: { name: '101', levelId: levelB1.id } },
    update: {},
    create: { name: '101', levelId: levelB1.id },
  });
  const classB1_102 = await prisma.class.upsert({
    where: { name_levelId: { name: '102', levelId: levelB1.id } },
    update: {},
    create: { name: '102', levelId: levelB1.id },
  });

  const defaultPassword = await hashPassword('123456');

  // --- Öğretmen (Dil okulu) ---
  const teacherUser = await prisma.user.upsert({
    where: { email: 'ogretmen@dilokulu.com' },
    update: {},
    create: {
      name: 'Elif Öğretmen',
      email: 'ogretmen@dilokulu.com',
      passwordHash: defaultPassword,
      role: 'TEACHER',
    },
  });
  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id },
  });

  // --- Öğrenciler (Dil okulu örnekleri; her sınıfa en az 5’er, ek 3’er öğrenci dahil) ---
  const studentsData = [
    { name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@email.com', classId: classA1_101.id },
    { name: 'Mehmet Kaya', email: 'mehmet.kaya@email.com', classId: classA1_101.id },
    { name: 'Elif Yıldız', email: 'elif.yildiz@email.com', classId: classA1_101.id },
    { name: 'Burak Şahin', email: 'burak.sahin@email.com', classId: classA1_101.id },
    { name: 'Ceren Acar', email: 'ceren.acar@email.com', classId: classA1_101.id },
    { name: 'Zeynep Demir', email: 'zeynep.demir@email.com', classId: classA1_102.id },
    { name: 'Can Öztürk', email: 'can.ozturk@email.com', classId: classA1_102.id },
    { name: 'Derya Kılıç', email: 'derya.kilic@email.com', classId: classA1_102.id },
    { name: 'Furkan Aydın', email: 'furkan.aydin@email.com', classId: classA1_102.id },
    { name: 'Gamze Polat', email: 'gamze.polat@email.com', classId: classA1_102.id },
    { name: 'Selin Arslan', email: 'selin.arslan@email.com', classId: classA2_101.id },
    { name: 'Emre Çelik', email: 'emre.celik@email.com', classId: classA2_101.id },
    { name: 'Hakan Yurt', email: 'hakan.yurt@email.com', classId: classA2_101.id },
    { name: 'İrem Toprak', email: 'irem.toprak@email.com', classId: classA2_101.id },
    { name: 'Kaan Özer', email: 'kaan.ozer@email.com', classId: classA2_101.id },
    { name: 'Leyla Çetin', email: 'leyla.cetin@email.com', classId: classA2_102.id },
    { name: 'Murat Doğan', email: 'murat.dogan@email.com', classId: classA2_102.id },
    { name: 'Nazlı Erdem', email: 'nazli.erdem@email.com', classId: classA2_102.id },
    { name: 'Deniz Aydın', email: 'deniz.aydin@email.com', classId: classB1_101.id },
    { name: 'Ece Koç', email: 'ece.koc@email.com', classId: classB1_101.id },
    { name: 'Oğuz Güneş', email: 'oguz.gunes@email.com', classId: classB1_101.id },
    { name: 'Pelin Yılmaz', email: 'pelin.yilmaz@email.com', classId: classB1_101.id },
    { name: 'Rıza Arslan', email: 'riza.arslan@email.com', classId: classB1_101.id },
    { name: 'Sude Kara', email: 'sude.kara@email.com', classId: classB1_102.id },
    { name: 'Tolga Özkan', email: 'tolga.ozkan@email.com', classId: classB1_102.id },
    { name: 'Utku Demir', email: 'utku.demir@email.com', classId: classB1_102.id },
  ];

  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        passwordHash: defaultPassword,
        role: 'STUDENT',
      },
    });
    await prisma.student.upsert({
      where: { userId: user.id },
      update: { classId: s.classId },
      create: { userId: user.id, classId: s.classId },
    });
  }

  // --- Örnek ödevler (Dil okulu) ---
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } });
  if (teacher) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const assignmentsData = [
      {
        title: 'A1 - Kendini tanıtma (Introduce yourself)',
        description: 'En az 5 cümle ile kendinizi tanıtın. Ad, yaş, memleket, meslek ve bir hobiniz yazın. Basit present tense kullanın.',
        levelId: levelA1.id,
        weekNumber: 1,
        startDate: now,
        dueDate: nextWeek,
        isDraft: false,
      },
      {
        title: 'A1 - Günlük rutin (Daily routine)',
        description: 'Bir gününüzü anlatın. Sabah kalkış, kahvaltı, iş/okul, akşam aktiviteleri. Saatleri kullanın (örn. Saat yedide kalkarım).',
        levelId: levelA1.id,
        weekNumber: 2,
        startDate: now,
        dueDate: inTwoWeeks,
        isDraft: false,
      },
      {
        title: 'A2 - Geçen hafta sonu',
        description: 'Geçen hafta sonu neler yaptığınızı yazın. Past simple kullanın. En az 8 cümle.',
        levelId: levelA2.id,
        weekNumber: 1,
        startDate: now,
        dueDate: nextWeek,
        isDraft: false,
      },
      {
        title: 'A2 - Bir şehir tanıtımı',
        description: 'Sevdiğiniz bir şehri (Türkiye veya yurt dışı) tanıtın. Konum, iklim, gezilecek yerler, yemek. 10–12 cümle.',
        levelId: levelA2.id,
        weekNumber: 2,
        startDate: now,
        dueDate: inTwoWeeks,
        isDraft: false,
      },
      {
        title: 'B1 - Okuduğunuz bir kitap veya film',
        description: 'Son okuduğunuz kitabı veya izlediğiniz filmi özetleyin. Olay örgüsü, karakterler ve sizin yorumunuz. En az 15 cümle.',
        levelId: levelB1.id,
        weekNumber: 1,
        startDate: now,
        dueDate: nextWeek,
        isDraft: false,
      },
    ];

    const count = await prisma.assignment.count({ where: { createdBy: teacher.id } });
    if (count === 0) {
      for (const a of assignmentsData) {
        await prisma.assignment.create({
          data: {
            title: a.title,
            description: a.description,
            levelId: a.levelId,
            weekNumber: a.weekNumber,
            createdBy: teacher.id,
            startDate: a.startDate,
            dueDate: a.dueDate,
            isDraft: a.isDraft,
            attachments: '[]',
          },
        });
      }
    }
  }

  // Eski student@test.com varsa A1-101'e ata
  const legacyStudent = await prisma.user.findUnique({
    where: { email: 'student@test.com' },
  });
  if (legacyStudent) {
    await prisma.student.upsert({
      where: { userId: legacyStudent.id },
      update: { classId: classA1_101.id },
      create: { userId: legacyStudent.id, classId: classA1_101.id },
    });
  }

  console.log('Dil okulu seed verileri oluşturuldu.');
  console.log('  Öğretmen: ogretmen@dilokulu.com / 123456');
  console.log('  Öğrenci (örnek): ayse.yilmaz@email.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
