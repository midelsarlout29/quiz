const prisma = require('../prisma');

const labels = ['A', 'B', 'C', 'D'];

function distributeOptions(question) {
  const sorted = [...question.options].sort((a, b) => a.label.localeCompare(b.label));
  if (sorted.length < 2) return null;

  const entries = sorted.map((option) => ({
    text: option.text,
    explanation: option.explanation,
    isCorrect: option.isCorrect || option.label === question.correctAnswer
  }));

  const correctEntry = entries.find((entry) => entry.isCorrect) || entries[0];
  const otherEntries = entries.filter((entry) => entry !== correctEntry);
  const desiredCorrectIndex = question.id % sorted.length;
  const distributed = [];

  for (let index = 0; index < sorted.length; index += 1) {
    distributed[index] = index === desiredCorrectIndex ? correctEntry : otherEntries.shift();
  }

  return sorted.map((option, index) => ({
    id: option.id,
    label: labels[index] || String.fromCharCode(65 + index),
    text: distributed[index].text,
    explanation: distributed[index].explanation,
    isCorrect: Boolean(distributed[index].isCorrect)
  }));
}

async function shuffleQuizOptionsBeforePublish(quizId) {
  const questions = await prisma.question.findMany({
    where: { quizId: Number(quizId) },
    include: { options: true }
  });

  for (const question of questions) {
    const nextOptions = distributeOptions(question);
    if (!nextOptions) continue;

    const correct = nextOptions.find((option) => option.isCorrect);
    await prisma.$transaction([
      ...nextOptions.map((option) => prisma.questionOption.update({
        where: { id: option.id },
        data: {
          label: option.label,
          text: option.text,
          explanation: option.explanation,
          isCorrect: option.isCorrect
        }
      })),
      prisma.question.update({
        where: { id: question.id },
        data: { correctAnswer: correct?.label || question.correctAnswer }
      })
    ]);
  }
}

module.exports = { shuffleQuizOptionsBeforePublish };
