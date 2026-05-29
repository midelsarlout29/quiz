const { sanitizeText } = require('../utils/sanitize');

const labels = ['A', 'B', 'C', 'D'];

function splitSentences(text) {
  return sanitizeText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function pickTopic(sentence, index) {
  const words = sentence
    .replace(/[^a-zA-Z0-9À-ž\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 4);
  return words.slice(0, 3).join(' ') || `Topik ${index + 1}`;
}

function buildMultipleChoice(sentence, index, difficulty) {
  const topic = pickTopic(sentence, index);
  const correct = sentence.length > 220 ? `${sentence.slice(0, 217)}...` : sentence;
  const distractors = [
    `Pernyataan yang tidak berkaitan langsung dengan ${topic}`,
    `Kesimpulan yang bertentangan dengan informasi pada materi`,
    `Informasi tambahan yang tidak dapat dibuktikan dari materi`
  ];

  return {
    question: `Berdasarkan materi, pernyataan mana yang paling tepat tentang ${topic}?`,
    options: [correct, ...distractors],
    correct_answer: 'A',
    explanation: `Jawaban A benar karena diambil langsung dari inti materi: ${correct}`,
    option_explanations: {
      A: 'Sesuai dengan isi materi.',
      B: 'Terlalu umum dan tidak menjadi inti kalimat pada materi.',
      C: 'Bertentangan dengan informasi utama pada materi.',
      D: 'Tidak didukung secara eksplisit oleh materi.'
    },
    difficulty,
    topic
  };
}

function buildTrueFalse(sentence, index, difficulty) {
  const topic = pickTopic(sentence, index);
  const isTrue = index % 2 === 0;
  const question = isTrue
    ? `Benar atau salah: ${sentence}`
    : `Benar atau salah: Materi tidak membahas ${topic}.`;

  return {
    question,
    options: ['Benar', 'Salah', 'Tidak dapat ditentukan', 'Lewati'],
    correct_answer: isTrue ? 'A' : 'B',
    explanation: isTrue
      ? 'Pernyataan benar karena sesuai dengan kalimat pada materi.'
      : 'Pernyataan salah karena topik tersebut dibahas dalam materi.',
    option_explanations: {
      A: isTrue ? 'Sesuai isi materi.' : 'Tidak tepat karena materi justru membahas topik tersebut.',
      B: isTrue ? 'Tidak tepat karena pernyataan sesuai materi.' : 'Sesuai, pernyataan meniadakan hal yang ada di materi.',
      C: 'Materi menyediakan konteks yang cukup.',
      D: 'Bukan jawaban substantif.'
    },
    difficulty,
    topic
  };
}

function buildShortAnswer(sentence, index, difficulty) {
  const topic = pickTopic(sentence, index);
  return {
    question: `Jelaskan secara singkat inti materi tentang ${topic}.`,
    options: ['Jawaban singkat sesuai materi', 'Jawaban tidak relevan', 'Jawaban bertentangan', 'Tidak menjawab'],
    correct_answer: 'A',
    explanation: `Jawaban perlu memuat gagasan inti berikut: ${sentence}`,
    option_explanations: {
      A: 'Memuat inti materi.',
      B: 'Tidak menjawab topik.',
      C: 'Bertentangan dengan materi.',
      D: 'Tidak memberikan informasi.'
    },
    difficulty,
    topic
  };
}

class AIQuestionGenerator {
  async generate({ materialText, questionCount, difficulty, questionType, language }) {
    const sentences = splitSentences(materialText);
    const source = sentences.length ? sentences : ['Materi belum memiliki kalimat panjang yang cukup, sehingga soal dibuat dari judul dan konteks materi yang tersedia.'];
    const count = Math.max(50, Math.min(Number(questionCount) || 50, 100));

    return Array.from({ length: count }, (_, index) => {
      const sentence = source[index % source.length];
      if (questionType === 'true_false') {
        return buildTrueFalse(sentence, index, difficulty);
      }
      if (questionType === 'short_answer') {
        return buildShortAnswer(sentence, index, difficulty);
      }
      return buildMultipleChoice(sentence, index, difficulty);
    });
  }
}

module.exports = AIQuestionGenerator;
