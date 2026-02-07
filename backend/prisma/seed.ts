import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  STAFF,
  TEST_STUDENT,
  STUDENTS_A101,
  STUDENTS_A102,
  A1_ASSIGNMENT_TITLES,
  A2_ASSIGNMENT_TITLES,
  B1_ASSIGNMENT_TITLES,
  ANNOUNCEMENT_TITLES,
  TIMELINE_SUMMARIES,
  ERROR_BANK_TEXTS,
  INTERVENTION_REASONS,
} from './seed-demo-data';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const hash = (p: string) => bcrypt.hash(p, SALT_ROUNDS);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
/** 45-95 arası sınav/başarı puanı */
function examScore(): number {
  return randInt(45, 95);
}
/** Hafta offset: 0 = bu hafta, 20 = 20 hafta önce */
function weeksAgo(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d;
}

async function main() {
  const passwordDemo = await hash('türkçe');
  const passwordLegacy = await hash('123456');

  // --- Seviyeler: A1, A2, B1 (her kur 10 hafta; A1/A2 tamamlanmış, B1 aktif) ---
  const levelA1 = await prisma.level.upsert({
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

  // --- Sınıflar: B1 - A101, A102 ---
  const classA101 = await prisma.class.upsert({
    where: { name_levelId: { name: 'A101', levelId: levelB1.id } },
    update: {},
    create: { name: 'A101', levelId: levelB1.id },
  });
  const classA102 = await prisma.class.upsert({
    where: { name_levelId: { name: 'A102', levelId: levelB1.id } },
    update: {},
    create: { name: 'A102', levelId: levelB1.id },
  });

  // --- 7 Personel: 1 PDG (ADMIN), 6 öğretmen (Eva dahil). Sabit şifre: türkçe ---
  const teacherIds: string[] = [];
  let pdgUserId: string | null = null;

  for (const s of STAFF) {
    const isPdgOrEva = s.email === 'pdg@isubudilmer.com' || s.email === 'eva@isubudilmer.com';
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash: passwordDemo, name: s.name, role: s.role },
      create: {
        name: s.name,
        email: s.email,
        passwordHash: isPdgOrEva ? passwordDemo : passwordLegacy,
        role: s.role,
      },
    });
    if (s.role === 'ADMIN') pdgUserId = user.id;
    if (s.role === 'TEACHER') {
      const teacher = await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      teacherIds.push(teacher.id);
    }
  }

  // --- Öğrenciler: A101 (25), A102 (25), e-posta benzersiz; test öğrenci ogrenci@isubudilmer.com ---
  const studentIdsA101: string[] = [];
  const studentIdsA102: string[] = [];

  const slug = (name: string, country: string, i: number) =>
    name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') + '.' + i + '@isubudilmer.com';

  for (let i = 0; i < STUDENTS_A101.length; i++) {
    const s = STUDENTS_A101[i];
    const email = slug(s.name, s.country, i + 1);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: s.name,
        email,
        passwordHash: passwordLegacy,
        role: 'STUDENT',
      },
    });
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: { classId: classA101.id },
      create: { userId: user.id, classId: classA101.id },
    });
    studentIdsA101.push(student.id);
  }

  for (let i = 0; i < STUDENTS_A102.length; i++) {
    const s = STUDENTS_A102[i];
    const email = slug(s.name, s.country, i + 1);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: s.name,
        email,
        passwordHash: passwordLegacy,
        role: 'STUDENT',
      },
    });
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: { classId: classA102.id },
      create: { userId: user.id, classId: classA102.id },
    });
    studentIdsA102.push(student.id);
  }

  // Test öğrenci: ogrenci@isubudilmer.com / türkçe
  const testUser = await prisma.user.upsert({
    where: { email: TEST_STUDENT.email },
    update: { passwordHash: passwordDemo, name: TEST_STUDENT.name },
    create: {
      name: TEST_STUDENT.name,
      email: TEST_STUDENT.email,
      passwordHash: passwordDemo,
      role: 'STUDENT',
    },
  });
  const testStudent = await prisma.student.upsert({
    where: { userId: testUser.id },
    update: { classId: classA101.id },
    create: { userId: testUser.id, classId: classA101.id },
  });
  studentIdsA101.push(testStudent.id);

  const allStudentIds = [...studentIdsA101, ...studentIdsA102];

  const now = new Date();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  // --- A1 geçmiş kur ödevleri (10 hafta, 30–40 hafta önce) ---
  for (let week = 1; week <= A1_ASSIGNMENT_TITLES.length; week++) {
    const title = A1_ASSIGNMENT_TITLES[week - 1];
    const startDate = new Date(now.getTime() - (40 - week) * oneWeekMs);
    const dueDate = new Date(startDate.getTime() + oneWeekMs);
    const teacherId = pick(teacherIds);
    let homework = await prisma.homework.findFirst({ where: { levelId: levelA1.id, weekNumber: week } });
    if (!homework) {
      homework = await prisma.homework.create({
        data: {
          teacherId,
          levelId: levelA1.id,
          weekNumber: week,
          title,
          description: `A1 hafta ${week} ödevi.`,
          type: 'TEXT',
        },
      });
    }
    const existing = await prisma.assignment.findFirst({ where: { levelId: levelA1.id, weekNumber: week } });
    if (!existing) {
      await prisma.assignment.create({
        data: {
          homeworkId: homework.id,
          title,
          description: `A1 hafta ${week}.`,
          levelId: levelA1.id,
          weekNumber: week,
          createdBy: teacherId,
          startDate,
          dueDate,
          isDraft: false,
          attachments: '[]',
        },
      });
    }
  }

  // --- A2 geçmiş kur ödevleri (10 hafta, 20–30 hafta önce) ---
  const levelA2 = await prisma.level.findUnique({ where: { name: 'A2' } });
  if (levelA2) {
    for (let week = 1; week <= A2_ASSIGNMENT_TITLES.length; week++) {
      const title = A2_ASSIGNMENT_TITLES[week - 1];
      const startDate = new Date(now.getTime() - (30 - week) * oneWeekMs);
      const dueDate = new Date(startDate.getTime() + oneWeekMs);
      const teacherId = pick(teacherIds);
      let homework = await prisma.homework.findFirst({ where: { levelId: levelA2.id, weekNumber: week } });
      if (!homework) {
        homework = await prisma.homework.create({
          data: {
            teacherId,
            levelId: levelA2.id,
            weekNumber: week,
            title,
            description: `A2 hafta ${week} ödevi.`,
            type: 'TEXT',
          },
        });
      }
      const existing = await prisma.assignment.findFirst({ where: { levelId: levelA2.id, weekNumber: week } });
      if (!existing) {
        await prisma.assignment.create({
          data: {
            homeworkId: homework.id,
            title,
            description: `A2 hafta ${week}.`,
            levelId: levelA2.id,
            weekNumber: week,
            createdBy: teacherId,
            startDate,
            dueDate,
            isDraft: false,
            attachments: '[]',
          },
        });
      }
    }
  }

  // --- B1 ödevler: 20+ hafta geçmiş + güncel. Homework + Assignment, her ikisi sınıfa atanmış ---

  for (let week = 1; week <= B1_ASSIGNMENT_TITLES.length; week++) {
    const title = B1_ASSIGNMENT_TITLES[week - 1];
    const startDate = new Date(now.getTime() - (B1_ASSIGNMENT_TITLES.length - week + 2) * oneWeekMs);
    const dueDate = new Date(startDate.getTime() + oneWeekMs);
    const teacherId = pick(teacherIds);

    let homework = await prisma.homework.findFirst({
      where: { levelId: levelB1.id, weekNumber: week },
    });
    if (!homework) {
      homework = await prisma.homework.create({
        data: {
          teacherId,
          levelId: levelB1.id,
          weekNumber: week,
          title,
          description: `B1 hafta ${week} ödevi. En az 10 cümle yazın.`,
          type: 'TEXT',
        },
      });
    }

    const existing = await prisma.assignment.findFirst({
      where: { levelId: levelB1.id, weekNumber: week },
    });
    if (!existing) {
      const assignment = await prisma.assignment.create({
        data: {
          homeworkId: homework.id,
          title,
          description: `B1 hafta ${week}.`,
          levelId: levelB1.id,
          weekNumber: week,
          createdBy: teacherId,
          startDate,
          dueDate,
          isDraft: false,
          attachments: '[]',
        },
      });
      await prisma.assignmentTarget.createMany({
        data: [
          { assignmentId: assignment.id, targetType: 'CLASS', classId: classA101.id },
          { assignmentId: assignment.id, targetType: 'CLASS', classId: classA102.id },
        ],
      });
    }
  }

  const b1Assignments = await prisma.assignment.findMany({
    where: { levelId: levelB1.id, isDraft: false },
    orderBy: { weekNumber: 'asc' },
  });

  // --- Teslimler: her ödev için öğrencilerin ~%75'i teslim etmiş, bir kısmı gecikmeli ---
  for (const assignment of b1Assignments) {
    const targetStudents = assignment.weekNumber <= 10 ? studentIdsA101 : allStudentIds;
    const submitCount = Math.floor(targetStudents.length * (0.7 + Math.random() * 0.2));
    const submitters = pickN(targetStudents, submitCount);

    for (const studentId of submitters) {
      const existing = await prisma.submission.findFirst({
        where: { assignmentId: assignment.id, studentId },
      });
      if (existing) continue;
      const isLate = Math.random() < 0.2;
      const submittedAt = new Date(assignment.dueDate.getTime() + (isLate ? randInt(1, 3) * 24 * 60 * 60 * 1000 : 0));
      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId,
          submittedAt,
          isLate,
          contentText: `B1 hafta ${assignment.weekNumber} ödev metni. Öğrenci çalışması.`,
          attachments: '[]',
        },
      }).catch(() => {});
    }
  }

  // Submission'ları assignment+student bazlı okuyup evaluation ekleyeceğiz (unique submissionId)
  const submissions = await prisma.submission.findMany({
    where: { assignmentId: { in: b1Assignments.map((a) => a.id) } },
    include: { assignment: true },
  });

  for (const sub of submissions) {
    const hasEval = await prisma.evaluation.findUnique({ where: { submissionId: sub.id } });
    if (!hasEval) {
      await prisma.evaluation.create({
        data: {
          submissionId: sub.id,
          teacherId: sub.assignment.createdBy,
          score: examScore(),
          feedback: 'İyi çalışma. Geçmiş zaman kullanımına dikkat edin.',
          accepted: true,
        },
      }).catch(() => {});
    }
  }

  // --- Hata bankası: öğrencilerin bir kısmına grammar/vocabulary hataları ---
  for (const studentId of pickN(allStudentIds, 30)) {
    const n = randInt(1, 4);
    for (let i = 0; i < n; i++) {
      await prisma.errorBankEntry.create({
        data: {
          studentId,
          teacherId: pick(teacherIds),
          errorText: pick(ERROR_BANK_TEXTS),
        },
      }).catch(() => {});
    }
  }

  // --- Duyurular: 20+ hafta boyunca, PDG ve öğretmenler (authorId = User id) ---
  const teacherUserIds = await prisma.teacher.findMany({ where: { id: { in: teacherIds } }, select: { userId: true } }).then((t) => t.map((x) => x.userId));
  const authorIds = pdgUserId ? [pdgUserId, ...teacherUserIds] : teacherUserIds;
  const existingAnnCount = await prisma.announcement.count();
  if (existingAnnCount < ANNOUNCEMENT_TITLES.length) {
    for (let i = existingAnnCount; i < ANNOUNCEMENT_TITLES.length; i++) {
      const createdAt = weeksAgo(ANNOUNCEMENT_TITLES.length - i);
      await prisma.announcement.create({
        data: {
          title: ANNOUNCEMENT_TITLES[i],
          body: `Duyuru metni: ${ANNOUNCEMENT_TITLES[i]}. Tarih: ${createdAt.toLocaleDateString('tr-TR')}.`,
          authorId: pick(authorIds),
          createdAt,
        },
      }).catch(() => {});
    }
  }

  // --- Zaman tüneli: sınıf bazlı, 30 hafta paylaşım (dolu görünsün) ---
  const classes = [classA101, classA102];
  const timelineWeeks = 30;
  for (let w = 0; w < timelineWeeks; w++) {
    const postDate = weeksAgo(w);
    for (const cls of classes) {
      await prisma.timelinePost.create({
        data: {
          classId: cls.id,
          teacherId: pick(teacherIds),
          summary: pick(TIMELINE_SUMMARIES),
          postDate,
        },
      }).catch(() => {});
    }
  }

  // --- Yoklama oturumları ve kayıtlar: haftalık 2-3 oturum, öğrencilerin ~%80'i katılmış ---
  for (let w = 0; w < 20; w++) {
    const base = weeksAgo(w);
    for (const cls of classes) {
      for (let s = 0; s < 2; s++) {
        const startTime = new Date(base);
        startTime.setHours(10 + s * 2, 0, 0, 0);
        const endTime = new Date(startTime.getTime() + 45 * 60 * 1000);
        const code = `A${w.toString(36)}${cls.name}${s}`;
        const session = await prisma.attendanceSession.create({
          data: {
            code,
            classId: cls.id,
            teacherId: pick(teacherIds),
            startTime,
            endTime,
            topic: `Ders ${w * 2 + s + 1}`,
          },
        }).catch(() => null);
        if (session) {
          const classStudentIds = cls.id === classA101.id ? studentIdsA101 : studentIdsA102;
          const presentCount = Math.floor(classStudentIds.length * (0.75 + Math.random() * 0.2));
          const present = pickN(classStudentIds, presentCount);
          for (const studentId of present) {
            await prisma.attendanceRecord.create({
              data: { sessionId: session.id, studentId },
            }).catch(() => {});
          }
        }
      }
    }
  }

  // --- Müdahale logları: devamsız / ödev eksik / düşük not ---
  const atRiskStudents = pickN(allStudentIds, 12);
  for (const studentId of atRiskStudents) {
    await prisma.interventionLog.create({
      data: {
        studentId,
        teacherId: pick(teacherIds),
        reason: pick(INTERVENTION_REASONS),
        note: 'Demo müdahale kaydı.',
      },
    }).catch(() => {});
  }

  // --- Öğrenci beceri puanları (radar): vocabulary, grammar, listening, speaking 50-95 ---
  for (const studentId of allStudentIds) {
    await prisma.studentSkillScore.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        vocabulary: randInt(50, 95),
        grammar: randInt(50, 95),
        listening: randInt(50, 95),
        speaking: randInt(50, 95),
      },
    }).catch(() => {});
  }

  // Test öğrenci için de skill score
  await prisma.studentSkillScore.upsert({
    where: { studentId: testStudent.id },
    update: {},
    create: {
      studentId: testStudent.id,
      vocabulary: randInt(60, 90),
      grammar: randInt(60, 90),
      listening: randInt(60, 90),
      speaking: randInt(60, 90),
    },
  }).catch(() => {});

  console.log('Demo seed tamamlandı.');
  console.log('  Seviyeler: A1, A2, B1 (A1/A2 geçmiş kur ödevleri, B1 aktif)');
  console.log('  Sınıflar: A101, A102 (~25 öğrenci each)');
  console.log('  Ödevler: A1 (10 hft), A2 (10 hft), B1 (21 hft); zaman tüneli 30 hft');
  console.log('  Sabit hesaplar (şifre: türkçe):');
  console.log('    PDG: pdg@isubudilmer.com');
  console.log('    Eva: eva@isubudilmer.com');
  console.log('    Test öğrenci: ogrenci@isubudilmer.com');
  console.log('  Diğer öğretmen/öğrenci: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
