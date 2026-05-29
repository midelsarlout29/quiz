const prisma = require('../prisma');

async function scoreAttempt(attemptId, submitStatus = 'SUBMITTED') {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: Number(attemptId) },
    include: {
      quiz: { include: { questions: true } },
      answers: { include: { question: true } }
    }
  });

  if (!attempt) {
    const error = new Error('Attempt tidak ditemukan');
    error.status = 404;
    throw error;
  }

  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  for (const question of attempt.quiz.questions) {
    const answer = answerMap.get(question.id);
    const normalizedAnswer = String(answer?.answer || '').trim().toUpperCase();
    const normalizedCorrect = String(question.correctAnswer || '').trim().toUpperCase();
    const answered = normalizedAnswer.length > 0;
    const isCorrect = answered && normalizedAnswer === normalizedCorrect;

    if (!answered) unansweredCount += 1;
    else if (isCorrect) correctCount += 1;
    else wrongCount += 1;

    if (answer) {
      await prisma.quizAnswer.update({
        where: { id: answer.id },
        data: { isCorrect }
      });
    }
  }

  const totalQuestions = attempt.quiz.questions.length;
  const score = totalQuestions ? (correctCount / totalQuestions) * 100 : 0;
  const submittedAt = new Date();
  const durationSeconds = Math.max(0, Math.floor((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000));
  const passed = score >= attempt.quiz.passingGrade;

  const updated = await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      status: submitStatus,
      submittedAt,
      durationSeconds,
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      score,
      passed
    }
  });

  await rebuildRankings(attempt.quizId);
  return updated;
}

async function rebuildRankings(quizId) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: Number(quizId), status: { in: ['SUBMITTED', 'EXPIRED'] } },
    orderBy: [{ score: 'desc' }, { durationSeconds: 'asc' }]
  });

  await prisma.ranking.deleteMany({ where: { quizId: Number(quizId) } });
  for (const [index, attempt] of attempts.entries()) {
    await prisma.ranking.create({
      data: {
        quizId: Number(quizId),
        attemptId: attempt.id,
        participantId: attempt.participantId,
        score: attempt.score,
        rank: index + 1
      }
    });
  }
}

module.exports = { scoreAttempt, rebuildRankings };
