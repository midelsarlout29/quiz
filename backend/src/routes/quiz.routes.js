const express = require('express');
const prisma = require('../prisma');
const { authenticate, allowRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { quizSchema, validate } = require('../utils/validators');
const { scoreAttempt } = require('../services/scoringService');
const { shuffleQuizOptionsBeforePublish } = require('../services/optionShuffleService');

const router = express.Router();
router.use(authenticate);

function quizInclude() {
  return {
    category: true,
    material: true,
    creator: { select: { id: true, name: true, email: true } },
    questions: {
      include: {
        options: { orderBy: { label: 'asc' } },
        explanation: true
      },
      orderBy: { id: 'asc' }
    }
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.role === 'participant') where.status = 'PUBLISHED';
  if (req.user.role === 'creator') where.creatorId = req.user.id;
  const quizzes = await prisma.quiz.findMany({ where, include: quizInclude(), orderBy: { createdAt: 'desc' } });
  res.json(quizzes);
}));

router.post('/', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const data = validate(quizSchema, req.body);
  const quiz = await prisma.quiz.create({ data: { ...data, creatorId: req.user.id }, include: quizInclude() });
  res.status(201).json(quiz);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: Number(req.params.id) }, include: quizInclude() });
  if (!quiz) return res.status(404).json({ message: 'Kuis tidak ditemukan' });
  res.json(quiz);
}));

router.put('/:id', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const existing = await prisma.quiz.findUnique({ where: { id: Number(req.params.id) } });
  if (!existing) return res.status(404).json({ message: 'Kuis tidak ditemukan' });
  if (req.user.role === 'creator' && existing.creatorId !== req.user.id) {
    return res.status(403).json({ message: 'Tidak dapat mengedit kuis milik pengguna lain' });
  }
  const data = validate(quizSchema, req.body);
  const quiz = await prisma.quiz.update({ where: { id: existing.id }, data, include: quizInclude() });
  res.json(quiz);
}));

router.post('/:id/publish', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  await shuffleQuizOptionsBeforePublish(req.params.id);
  const quiz = await prisma.quiz.update({
    where: { id: Number(req.params.id) },
    data: { status: 'PUBLISHED' },
    include: quizInclude()
  });
  res.json(quiz);
}));

router.delete('/:id', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  await prisma.quiz.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

router.post('/:id/start', allowRoles('participant', 'admin'), asyncHandler(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: Number(req.params.id) }, include: { questions: true } });
  if (!quiz || quiz.status !== 'PUBLISHED') return res.status(404).json({ message: 'Kuis publik tidak ditemukan' });

  const existingAttempt = await prisma.quizAttempt.findFirst({
    where: {
      quizId: quiz.id,
      participantId: req.user.id,
      status: 'IN_PROGRESS'
    },
    orderBy: { startedAt: 'desc' }
  });

  if (existingAttempt) {
    return res.status(200).json(existingAttempt);
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      participantId: req.user.id,
      totalQuestions: quiz.questions.length
    }
  });
  res.status(201).json(attempt);
}));

router.post('/:id/submit-expired/:attemptId', asyncHandler(async (req, res) => {
  const result = await scoreAttempt(req.params.attemptId, 'EXPIRED');
  res.json(result);
}));

module.exports = router;
