import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

async function main() {
  // --- Seviyeler (Dil okulu: A1–B2; kurum B1 kuru) ---
  await prisma.level.upsert({
    where: { name: 'A1' },
    update: {},
    create: { name: 'A1', sortOrder: 1 },
  });
  await prisma.level.upsert({
    where: { name: 'A2' },
    update: {},
    create: { name: 'A2', sortOrder: 2 },
  });
  const levelB1 = await prisma.level.upsert({
    where: { name: 'B1' },
    update: {},
    create: { name: 'B1', sortOrder: 3 },
  });
  await prisma.level.upsert({
    where: { name: 'B2' },
    update: {},
    create: { name: 'B2', sortOrder: 4 },
  });

  // --- Sınıflar: B1 kurunda sadece 101 ve 102 ---
  const class101 = await prisma.class.upsert({
    where: { name_levelId: { name: '101', levelId: levelB1.id } },
    update: {},
    create: { name: '101', levelId: levelB1.id },
  });
  const class102 = await prisma.class.upsert({
    where: { name_levelId: { name: '102', levelId: levelB1.id } },
    update: {},
    create: { name: '102', levelId: levelB1.id },
  });

  const defaultPassword = await hashPassword('123456');

  // --- 7 Öğretmen (Türkçe öğretmenleri) ---
  const teachersData = [
    { name: 'Elif Yılmaz', email: 'elif.yilmaz@dilokulu.com' },
    { name: 'Mehmet Kaya', email: 'mehmet.kaya@dilokulu.com' },
    { name: 'Zeynep Demir', email: 'zeynep.demir@dilokulu.com' },
    { name: 'Can Öztürk', email: 'can.ozturk@dilokulu.com' },
    { name: 'Selin Arslan', email: 'selin.arslan@dilokulu.com' },
    { name: 'Burak Şahin', email: 'burak.sahin@dilokulu.com' },
    { name: 'Derya Kılıç', email: 'derya.kilic@dilokulu.com' },
  ];

  const teacherIds: string[] = [];
  for (const t of teachersData) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        passwordHash: defaultPassword,
        role: 'TEACHER',
      },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    teacherIds.push(teacher.id);
  }

  // --- 50 Öğrenci: 25'er kişi 101 ve 102, farklı milletlerden ---
  const studentsClass101 = [
    { name: 'Ahmed Hassan', email: 'ahmed.hassan.b1@email.com' },
    { name: 'Fatima Al-Rashid', email: 'fatima.alrashid@email.com' },
    { name: 'Omar Khalil', email: 'omar.khalil@email.com' },
    { name: 'Layla Mohammed', email: 'layla.mohammed@email.com' },
    { name: 'Yusuf Ibrahim', email: 'yusuf.ibrahim@email.com' },
    { name: 'Dmitri Volkov', email: 'dmitri.volkov@email.com' },
    { name: 'Anastasia Petrova', email: 'anastasia.petrova@email.com' },
    { name: 'Ivan Kozlov', email: 'ivan.kozlov@email.com' },
    { name: 'Elena Sokolova', email: 'elena.sokolova@email.com' },
    { name: 'Hans Mueller', email: 'hans.mueller@email.com' },
    { name: 'Sophie Weber', email: 'sophie.weber@email.com' },
    { name: 'Lukas Fischer', email: 'lukas.fischer@email.com' },
    { name: 'Marie Dubois', email: 'marie.dubois@email.com' },
    { name: 'Pierre Bernard', email: 'pierre.bernard@email.com' },
    { name: 'Claire Moreau', email: 'claire.moreau@email.com' },
    { name: 'James Wilson', email: 'james.wilson@email.com' },
    { name: 'Emma Thompson', email: 'emma.thompson@email.com' },
    { name: 'Carlos García', email: 'carlos.garcia@email.com' },
    { name: 'Isabella Martínez', email: 'isabella.martinez@email.com' },
    { name: 'Wei Chen', email: 'wei.chen@email.com' },
    { name: 'Yuki Tanaka', email: 'yuki.tanaka@email.com' },
    { name: 'Priya Sharma', email: 'priya.sharma@email.com' },
    { name: 'Marco Rossi', email: 'marco.rossi@email.com' },
    { name: 'Giulia Romano', email: 'giulia.romano@email.com' },
    { name: 'Lucas Silva', email: 'lucas.silva@email.com' },
  ];

  const studentsClass102 = [
    { name: 'Amira Hassan', email: 'amira.hassan.b1@email.com' },
    { name: 'Khalid Al-Masri', email: 'khalid.almasri@email.com' },
    { name: 'Nina Ivanova', email: 'nina.ivanova@email.com' },
    { name: 'Alexei Popov', email: 'alexei.popov@email.com' },
    { name: 'Friedrich Schmidt', email: 'friedrich.schmidt@email.com' },
    { name: 'Anna Becker', email: 'anna.becker@email.com' },
    { name: 'Jean Laurent', email: 'jean.laurent@email.com' },
    { name: 'Olivia Brown', email: 'olivia.brown@email.com' },
    { name: 'Miguel López', email: 'miguel.lopez@email.com' },
    { name: 'Sakura Yamamoto', email: 'sakura.yamamoto@email.com' },
    { name: 'Li Wei', email: 'li.wei@email.com' },
    { name: 'Raj Patel', email: 'raj.patel@email.com' },
    { name: 'Alessandro Bianchi', email: 'alessandro.bianchi@email.com' },
    { name: 'Elena Costa', email: 'elena.costa@email.com' },
    { name: 'Mohammed Ali', email: 'mohammed.ali.b1@email.com' },
    { name: 'Svetlana Novikova', email: 'svetlana.novikova@email.com' },
    { name: 'Thomas Wagner', email: 'thomas.wagner@email.com' },
    { name: 'Camille Martin', email: 'camille.martin@email.com' },
    { name: 'William Davis', email: 'william.davis@email.com' },
    { name: 'Carmen Ruiz', email: 'carmen.ruiz@email.com' },
    { name: 'Hiroshi Sato', email: 'hiroshi.sato@email.com' },
    { name: 'Xiao Ming', email: 'xiao.ming@email.com' },
    { name: 'Ananya Singh', email: 'ananya.singh@email.com' },
    { name: 'Francesco Conti', email: 'francesco.conti@email.com' },
    { name: 'Ana Oliveira', email: 'ana.oliveira@email.com' },
  ];

  for (const s of [...studentsClass101.map((x) => ({ ...x, classId: class101.id })), ...studentsClass102.map((x) => ({ ...x, classId: class102.id }))]) {
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

  // --- B1 Türkçe ödevleri: 1., 2., 3. ve 4. hafta (bu hafta da verilecek) ---
  const now = new Date();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;

  const assignmentsData = [
    {
      title: 'B1 - Kendinizi tanıtın (Türkçe)',
      description: 'En az 10 cümle ile kendinizi tanıtın. Adınız, nerelisiniz, mesleğiniz, neden Türkçe öğrendiğiniz ve günlük rutininizden kısaca bahsedin. B1 seviyesine uygun cümleler kurun.',
      levelId: levelB1.id,
      weekNumber: 1,
      startDate: new Date(now.getTime() - 3 * oneWeek),
      dueDate: new Date(now.getTime() - 2 * oneWeek),
      isDraft: false,
    },
    {
      title: 'B1 - Geçen hafta sonu neler yaptınız?',
      description: 'Geçen hafta sonu yaptıklarınızı anlatın. En az 12 cümle yazın. Geçmiş zaman (-di, -miş) kullanın. Türkiye\'de veya kendi ülkenizde yaptığınız aktiviteleri anlatabilirsiniz.',
      levelId: levelB1.id,
      weekNumber: 2,
      startDate: new Date(now.getTime() - 2 * oneWeek),
      dueDate: new Date(now.getTime() - oneWeek),
      isDraft: false,
    },
    {
      title: 'B1 - Sevdiğiniz bir film veya diziyi anlatın',
      description: 'Son izlediğiniz bir filmi veya diziyi Türkçe olarak özetleyin. Konusu, karakterleri ve sizin yorumunuzu yazın. En az 15 cümle. B1 kelime ve dil bilgisi kullanın.',
      levelId: levelB1.id,
      weekNumber: 3,
      startDate: new Date(now.getTime() - oneWeek),
      dueDate: new Date(now.getTime()),
      isDraft: false,
    },
    {
      title: 'B1 - Bu hafta planlarınız (Bu hafta ödevi)',
      description: 'Bu hafta neler yapacaksınız? Hafta sonu planlarınızı veya iş/okul programınızı yazın. "-ecek/-acak" (gelecek zaman) kullanın. En az 12 cümle.',
      levelId: levelB1.id,
      weekNumber: 4,
      startDate: now,
      dueDate: new Date(now.getTime() + oneWeek),
      isDraft: false,
    },
  ];

  const firstTeacherId = teacherIds[0];
  const count = await prisma.assignment.count({ where: { levelId: levelB1.id, weekNumber: 1 } });
  if (count === 0) {
    for (const a of assignmentsData) {
      await prisma.assignment.create({
        data: {
          title: a.title,
          description: a.description,
          levelId: a.levelId,
          weekNumber: a.weekNumber,
          createdBy: firstTeacherId,
          startDate: a.startDate,
          dueDate: a.dueDate,
          isDraft: a.isDraft,
          attachments: '[]',
        },
      });
    }
  }

  // Eski test öğrencisi varsa B1-101'e ata
  const legacyStudent = await prisma.user.findUnique({
    where: { email: 'student@test.com' },
  });
  if (legacyStudent) {
    await prisma.student.upsert({
      where: { userId: legacyStudent.id },
      update: { classId: class101.id },
      create: { userId: legacyStudent.id, classId: class101.id },
    });
  }

  console.log('B1 kurunda örnek veriler oluşturuldu.');
  console.log('  Sınıflar: 101, 102 (B1)');
  console.log('  Öğretmenler: 7 (şifre: 123456)');
  console.log('  Öğrenciler: 50 (25+25, farklı milletler)');
  console.log('  Ödevler: B1 hafta 1, 2, 3, 4 (Türkçe)');
  console.log('  Giriş örneği - Öğretmen: elif.yilmaz@dilokulu.com / 123456');
  console.log('  Giriş örneği - Öğrenci: ahmed.hassan.b1@email.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
