const express = require('express');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { scoreAttempt } = require('../services/scoringService');

const router = express.Router();
router.use(authenticate);

router.get('/:id', asyncHandler(async (req, res) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: Number(req.params.id) },
    include: { answers: true, quiz: true }
  });
  if (!attempt) return res.status(404).json({ message: 'Attempt tidak ditemukan' });
  if (attempt.participantId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tidak dapat membuka attempt milik user lain' });
  }
  res.json(attempt);
}));

router.post('/:id/answer', asyncHandler(async (req, res) => {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: Number(req.params.id) } });
  if (!attempt) return res.status(404).json({ message: 'Attempt tidak ditemukan' });
  if (attempt.participantId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tidak dapat mengisi attempt milik user lain' });
  }

  const answer = await prisma.quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: Number(req.body.questionId) } },
    update: {
      answer: req.body.answer || null,
      isDoubtful: Boolean(req.body.isDoubtful),
      answeredAt: new Date()
    },
    create: {
      attemptId: attempt.id,
      questionId: Number(req.body.questionId),
      answer: req.body.answer || null,
      isDoubtful: Boolean(req.body.isDoubtful)
    }
  });
  res.json(answer);
}));

router.post('/:id/submit', asyncHandler(async (req, res) => {
  const result = await scoreAttempt(req.params.id);
  res.json(result);
}));

router.get('/:id/result', asyncHandler(async (req, res) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: Number(req.params.id) },
    include: { quiz: true, ranking: true, participant: { select: { id: true, name: true } } }
  });
  if (!attempt) return res.status(404).json({ message: 'Hasil tidak ditemukan' });
  res.json(attempt);
}));

router.get('/:id/explanations', asyncHandler(async (req, res) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      quiz: true,
      answers: true
    }
  });
  if (!attempt) return res.status(404).json({ message: 'Attempt tidak ditemukan' });

  const questions = await prisma.question.findMany({
    where: { quizId: attempt.quizId },
    include: { options: { orderBy: { label: 'asc' } }, explanation: true },
    orderBy: { id: 'asc' }
  });
  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  const payload = questions.map((question) => ({
    ...question,
    participantAnswer: answerMap.get(question.id)?.answer || null,
    isDoubtful: answerMap.get(question.id)?.isDoubtful || false,
    isCorrect: answerMap.get(question.id)?.isCorrect || false
  }));
  res.json({ attempt, questions: payload });
}));

module.exports = router;
