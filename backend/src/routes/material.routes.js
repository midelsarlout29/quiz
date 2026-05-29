const fs = require('fs');
const multer = require('multer');
const path = require('path');
const express = require('express');
const prisma = require('../prisma');
const { authenticate, allowRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { extractMaterialText } = require('../services/materialExtractor');
const AIQuestionGenerator = require('../services/AIQuestionGenerator');
const { generateSchema, validate } = require('../utils/validators');
const { normalizeDifficulty, normalizeQuestionType, sanitizeText } = require('../utils/sanitize');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return callback(new Error('Format file harus PDF, DOCX, atau TXT'));
    }
    callback(null, true);
  }
});

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const where = req.user.role === 'admin' ? {} : { uploaderId: req.user.id };
  const materials = await prisma.material.findMany({ where, include: { uploader: true }, orderBy: { createdAt: 'desc' } });
  res.json(materials);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const material = await prisma.material.findUnique({ where: { id: Number(req.params.id) } });
  if (!material) return res.status(404).json({ message: 'Materi tidak ditemukan' });
  res.json(material);
}));

router.post('/upload', allowRoles('admin', 'creator'), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'File wajib diupload' });
  const extractedText = await extractMaterialText(req.file);
  const sanitizedText = sanitizeText(extractedText);
  const material = await prisma.material.create({
    data: {
      title: req.body.title || req.file.originalname,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      extractedText,
      sanitizedText,
      uploaderId: req.user.id
    }
  });
  res.status(201).json(material);
}));

router.post('/:id/generate', allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const data = validate(generateSchema, req.body);
  const material = await prisma.material.findUnique({ where: { id: Number(req.params.id) } });
  if (!material) return res.status(404).json({ message: 'Materi tidak ditemukan' });

  const generator = new AIQuestionGenerator();
  const generated = await generator.generate({
    materialText: material.sanitizedText,
    questionCount: data.questionCount,
    difficulty: data.difficulty,
    questionType: data.questionType,
    language: data.language
  });

  const quiz = await prisma.quiz.create({
    data: {
      title: data.quizTitle || `Kuis ${material.title}`,
      description: `Dibuat otomatis dari materi ${material.title}`,
      categoryId: data.categoryId,
      materialId: material.id,
      creatorId: req.user.id,
      durationMinutes: data.questionCount,
      passingGrade: 70,
      status: 'DRAFT'
    }
  });

  const questions = [];
  for (const item of generated) {
    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        materialId: material.id,
        creatorId: req.user.id,
        categoryId: data.categoryId,
        type: normalizeQuestionType(data.questionType),
        text: item.question,
        correctAnswer: item.correct_answer,
        difficulty: normalizeDifficulty(item.difficulty),
        topic: item.topic,
        options: {
          create: item.options.map((text, index) => ({
            label: ['A', 'B', 'C', 'D'][index],
            text,
            isCorrect: ['A', 'B', 'C', 'D'][index] === item.correct_answer,
            explanation: item.option_explanations?.[['A', 'B', 'C', 'D'][index]] || null
          }))
        },
        explanation: { create: { content: item.explanation } }
      },
      include: { options: true, explanation: true }
    });
    questions.push(question);
  }

  res.status(201).json({ quiz, questions });
}));

module.exports = router;
