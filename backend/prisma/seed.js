const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'admin', label: 'Admin' },
    { name: 'creator', label: 'Pembuat Kuis / Guru / Dosen' },
    { name: 'participant', label: 'Peserta' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role
    });
  }

  const roleRows = await prisma.role.findMany();
  const roleId = Object.fromEntries(roleRows.map((role) => [role.name, role.id]));
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { name: 'Admin Smart Quiz', email: 'admin@smartquiz.test', roleId: roleId.admin },
    { name: 'Guru Demo', email: 'guru@smartquiz.test', roleId: roleId.creator, institution: 'Sekolah Demo' },
    { name: 'Peserta Demo', email: 'peserta@smartquiz.test', roleId: roleId.participant, institution: 'Umum' }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: { ...user, passwordHash }
    });
  }

  const categories = [
    'Sekolah',
    'Kuliah',
    'CPNS',
    'PPPK',
    'Tes kerja',
    'Sertifikasi',
    'Pelatihan',
    'Umum'
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Kategori kuis ${name}` }
    });
  }

  const creator = await prisma.user.findUnique({ where: { email: 'guru@smartquiz.test' } });
  const category = await prisma.category.findUnique({ where: { name: 'Umum' } });

  const material = await prisma.material.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Contoh Materi Literasi Digital',
      originalName: 'contoh-materi.txt',
      fileType: 'text/plain',
      filePath: 'seed/contoh-materi.txt',
      extractedText:
        'Literasi digital adalah kemampuan menggunakan teknologi informasi secara etis, aman, dan produktif. Pengguna perlu memahami keamanan kata sandi, verifikasi sumber informasi, privasi data, dan etika komunikasi daring.',
      sanitizedText:
        'Literasi digital adalah kemampuan menggunakan teknologi informasi secara etis, aman, dan produktif. Pengguna perlu memahami keamanan kata sandi, verifikasi sumber informasi, privasi data, dan etika komunikasi daring.',
      uploaderId: creator.id
    }
  });

  const quiz = await prisma.quiz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Tryout Literasi Digital',
      description: 'Contoh kuis awal dari seed data.',
      categoryId: category.id,
      materialId: material.id,
      creatorId: creator.id,
      durationMinutes: 30,
      passingGrade: 70,
      showResultDirectly: true,
      status: 'PUBLISHED'
    }
  });

  const existingQuestions = await prisma.question.count({ where: { quizId: quiz.id } });
  if (existingQuestions === 0) {
    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        materialId: material.id,
        creatorId: creator.id,
        categoryId: category.id,
        text: 'Apa tujuan utama literasi digital?',
        correctAnswer: 'A',
        difficulty: 'MUDAH',
        topic: 'Literasi digital',
        options: {
          create: [
            { label: 'A', text: 'Menggunakan teknologi secara etis, aman, dan produktif', isCorrect: true, explanation: 'Ini sesuai definisi materi.' },
            { label: 'B', text: 'Menghafal semua perangkat keras komputer', explanation: 'Ini terlalu sempit.' },
            { label: 'C', text: 'Menghindari semua komunikasi daring', explanation: 'Literasi digital bukan menghindari teknologi.' },
            { label: 'D', text: 'Membagikan semua data pribadi', explanation: 'Ini bertentangan dengan privasi data.' }
          ]
        },
        explanation: { create: { content: 'Literasi digital menekankan pemanfaatan teknologi secara etis, aman, dan produktif.' } }
      }
    });
    console.log(`Seeded question ${question.id}`);
  }

  await prisma.setting.upsert({
    where: { key: 'app_name' },
    update: { value: 'Smart Quiz Generator' },
    create: { key: 'app_name', value: 'Smart Quiz Generator' }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
