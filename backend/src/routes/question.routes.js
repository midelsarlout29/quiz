const express = require('express');
const prisma = require('../prisma');
const { authenticate, allowRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeDifficulty, normalizeQuestionType } = require('../utils/sanitize');
const { toCsv } = require('../services/exportService');

const router = express.Router();
router.use(authenticate);

function includeQuestion() {
  return { options: { orderBy: { label: 'asc' } }, explanation: true, category: true, creator: { select: { id: true, name: true } } };
}

router.get('/export.csv', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const questions = await prisma.question.findMany({ include: { options: true, explanation: true, category: true } });
  const rows = questions.map((question) => ({
    id: question.id,
    question: question.text,
    correct_answer: question.correctAnswer,
    difficulty: question.difficulty,
    topic: question.topic,
    category: question.category?.name,
    explanation: question.explanation?.content
  }));
  res.header('Content-Type', 'text/csv');
  res.attachment('bank-soal.csv');
  res.send(toCsv(rows));
}));

router.get('/', asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.quizId) where.quizId = Number(req.query.quizId);
  if (req.query.categoryId) where.categoryId = Number(req.query.categoryId);
  if (req.query.materialId) where.materialId = Number(req.query.materialId);
  if (req.query.creatorId) where.creatorId = Number(req.query.creatorId);
  if (req.query.difficulty) where.difficulty = normalizeDifficulty(req.query.difficulty);
  if (req.user.role === 'creator') where.creatorId = req.user.id;
  const questions = await prisma.question.findMany({ where, include: includeQuestion(), orderBy: { id: 'desc' } });
  res.json(questions);
}));

router.post('/', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const question = await prisma.question.create({
    data: {
      quizId: req.body.quizId ? Number(req.body.quizId) : null,
      materialId: req.body.materialId ? Number(req.body.materialId) : null,
      creatorId: req.user.id,
      categoryId: req.body.categoryId ? Number(req.body.categoryId) : null,
      type: normalizeQuestionType(req.body.type || 'multiple_choice'),
      text: req.body.text,
      correctAnswer: req.body.correctAnswer,
      difficulty: normalizeDifficulty(req.body.difficulty),
      topic: req.body.topic || null,
      options: {
        create: (req.body.options || []).map((option) => ({
          label: option.label,
          text: option.text,
          isCorrect: option.label === req.body.correctAnswer,
          explanation: option.explanation || null
        }))
      },
      explanation: req.body.explanation ? { create: { content: req.body.explanation } } : undefined
    },
    include: includeQuestion()
  });
  res.status(201).json(question);
}));

router.put('/:id', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.questionOption.deleteMany({ where: { questionId: id } });
  await prisma.questionExplanation.deleteMany({ where: { questionId: id } });
  const question = await prisma.question.update({
    where: { id },
    data: {
      text: req.body.text,
      correctAnswer: req.body.correctAnswer,
      difficulty: normalizeDifficulty(req.body.difficulty),
      topic: req.body.topic || null,
      categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
      options: {
        create: (req.body.options || []).map((option) => ({
          label: option.label,
          text: option.text,
          isCorrect: option.label === req.body.correctAnswer,
          explanation: option.explanation || null
        }))
      },
      explanation: req.body.explanation ? { create: { content: req.body.explanation } } : undefined
    },
    include: includeQuestion()
  });
  res.json(question);
}));

router.delete('/:id', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  await prisma.question.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

module.exports = router;
