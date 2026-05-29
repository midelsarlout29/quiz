const express = require('express');
const prisma = require('../prisma');
const { authenticate, allowRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { toCsv, toPdfBuffer } = require('../services/exportService');

const router = express.Router();
router.use(authenticate, allowRoles('admin', 'creator'));

async function reportRows(where = {}) {
  const attempts = await prisma.quizAttempt.findMany({
    where,
    include: {
      quiz: true,
      participant: { select: { name: true, email: true } },
      ranking: true
    },
    orderBy: { submittedAt: 'desc' }
  });
  return attempts.map((attempt) => ({
    quiz: attempt.quiz.title,
    participant: attempt.participant.name,
    email: attempt.participant.email,
    score: attempt.score.toFixed(2),
    correct: attempt.correctCount,
    wrong: attempt.wrongCount,
    unanswered: attempt.unansweredCount,
    passed: attempt.passed ? 'Lulus' : 'Tidak lulus',
    rank: attempt.ranking?.rank || '-'
  }));
}

router.get('/summary', asyncHandler(async (req, res) => {
  const [participants, quizzes, attempts, avg] = await Promise.all([
    prisma.user.count({ where: { role: { name: 'participant' } } }),
    prisma.quiz.count(),
    prisma.quizAttempt.count({ where: { status: { in: ['SUBMITTED', 'EXPIRED'] } } }),
    prisma.quizAttempt.aggregate({ _avg: { score: true }, where: { status: { in: ['SUBMITTED', 'EXPIRED'] } } })
  ]);

  const mostWrong = await prisma.quizAnswer.groupBy({
    by: ['questionId'],
    where: { isCorrect: false },
    _count: { questionId: true },
    orderBy: { _count: { questionId: 'desc' } },
    take: 5
  });

  const bestParticipants = await prisma.quizAttempt.findMany({
    where: { status: { in: ['SUBMITTED', 'EXPIRED'] } },
    include: { participant: { select: { name: true } }, quiz: { select: { title: true } } },
    orderBy: { score: 'desc' },
    take: 5
  });

  res.json({
    participants,
    quizzes,
    attempts,
    averageScore: avg._avg.score || 0,
    mostWrong,
    bestParticipants
  });
}));

router.get('/quizzes/:id', asyncHandler(async (req, res) => {
  const rows = await reportRows({ quizId: Number(req.params.id), status: { in: ['SUBMITTED', 'EXPIRED'] } });
  res.json(rows);
}));

router.get('/export.csv', asyncHandler(async (req, res) => {
  const rows = await reportRows({ status: { in: ['SUBMITTED', 'EXPIRED'] } });
  res.header('Content-Type', 'text/csv');
  res.attachment('laporan-hasil.csv');
  res.send(toCsv(rows));
}));

router.get('/export.pdf', asyncHandler(async (req, res) => {
  const rows = await reportRows({ status: { in: ['SUBMITTED', 'EXPIRED'] } });
  const buffer = await toPdfBuffer('Laporan Hasil Smart Quiz Generator', rows);
  res.header('Content-Type', 'application/pdf');
  res.attachment('laporan-hasil.pdf');
  res.send(buffer);
}));

module.exports = router;
