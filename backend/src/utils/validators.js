const { z } = require('zod');

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().min(3).optional());

const optionalAccessCode = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length ? trimmed : undefined;
}, z.string().min(4).max(24).regex(/^[A-Z0-9-]+$/, 'Kode kuis hanya boleh berisi huruf, angka, dan tanda hubung').optional());

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['creator', 'participant']).default('participant'),
  institution: z.string().optional(),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const quizSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  categoryId: z.coerce.number().int(),
  materialId: z.coerce.number().int().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1).default(90),
  passingGrade: z.coerce.number().int().min(0).max(100).default(70),
  showResultDirectly: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  accessCode: optionalAccessCode
});

const startQuizSchema = z.object({
  accessCode: optionalAccessCode
});

const generateSchema = z.object({
  questionCount: z.coerce.number().int().min(50).max(100),
  difficulty: z.enum(['mudah', 'sedang', 'sulit']).default('sedang'),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']).default('multiple_choice'),
  language: z.string().default('id'),
  quizTitle: optionalTrimmedString,
  categoryId: z.coerce.number().int()
});

function validate(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    const error = new Error(message);
    error.status = 422;
    throw error;
  }
  return parsed.data;
}

module.exports = { registerSchema, loginSchema, quizSchema, generateSchema, startQuizSchema, validate };
