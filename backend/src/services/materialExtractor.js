const fs = require('fs/promises');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { sanitizeText } = require('../utils/sanitize');

async function extractMaterialText(file) {
  const buffer = await fs.readFile(file.path);

  if (file.mimetype === 'text/plain') {
    return sanitizeText(buffer.toString('utf8'));
  }

  if (file.mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    return sanitizeText(result.text);
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return sanitizeText(result.value);
  }

  const error = new Error('Format file tidak didukung. Gunakan PDF, DOCX, atau TXT.');
  error.status = 422;
  throw error;
}

module.exports = { extractMaterialText };
