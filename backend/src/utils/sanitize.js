function sanitizeText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 120000);
}

function normalizeDifficulty(value) {
  const map = { mudah: 'MUDAH', sedang: 'SEDANG', sulit: 'SULIT' };
  return map[String(value || '').toLowerCase()] || 'SEDANG';
}

function normalizeQuestionType(value) {
  const map = {
    multiple_choice: 'MULTIPLE_CHOICE',
    true_false: 'TRUE_FALSE',
    short_answer: 'SHORT_ANSWER'
  };
  return map[String(value || '').toLowerCase()] || 'MULTIPLE_CHOICE';
}

module.exports = { sanitizeText, normalizeDifficulty, normalizeQuestionType };
