import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, Send } from 'lucide-react';
import { api } from '../api/client';

export default function TryoutPage() {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const [secondsLeft, setSecondsLeft] = useState(null);
  const question = quiz?.questions?.[active];
  const answeredCount = quiz?.questions?.filter((item) => Boolean(answers[item.id]?.answer)).length || 0;
  const allAnswered = quiz ? answeredCount === quiz.questions.length : false;
  const storageKey = `smart_quiz_attempt_${attemptId}`;
  const pendingKey = `smart_quiz_pending_${attemptId}`;

  useEffect(() => {
    const localAnswers = readLocalAnswers(storageKey);
    setAnswers(localAnswers);

    Promise.all([api.get(`/quizzes/${quizId}`), api.get(`/attempts/${attemptId}`)]).then(([quizResponse, attemptResponse]) => {
      setQuiz(quizResponse.data);
      const elapsedSeconds = Math.floor((Date.now() - new Date(attemptResponse.data.startedAt).getTime()) / 1000);
      setSecondsLeft(Math.max(0, quizResponse.data.durationMinutes * 60 - elapsedSeconds));

      const serverAnswers = Object.fromEntries(
        attemptResponse.data.answers.map((item) => [
          item.questionId,
          { answer: item.answer || '', isDoubtful: item.isDoubtful }
        ])
      );
      const merged = { ...serverAnswers, ...localAnswers };
      setAnswers(merged);
      writeJson(storageKey, merged);
      flushPending(merged);
    });
  }, [quizId]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }
    const id = setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    function handleOnline() {
      flushPending(answers);
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [answers]);

  const timer = useMemo(() => {
    const minutes = Math.floor((secondsLeft || 0) / 60);
    const seconds = (secondsLeft || 0) % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [secondsLeft]);

  async function answer(value) {
    const next = { ...(answers[question.id] || {}), answer: value };
    const nextAnswers = { ...answers, [question.id]: next };
    setAnswers(nextAnswers);
    writeJson(storageKey, nextAnswers);
    await saveAnswer(question.id, next);
  }

  async function toggleDoubt() {
    const next = { ...(answers[question.id] || {}), isDoubtful: !answers[question.id]?.isDoubtful };
    const nextAnswers = { ...answers, [question.id]: next };
    setAnswers(nextAnswers);
    writeJson(storageKey, nextAnswers);
    await saveAnswer(question.id, next);
  }

  async function saveAnswer(questionId, payload) {
    setSaveState('saving');
    try {
      await api.post(`/attempts/${attemptId}/answer`, { questionId, ...payload });
      removePending(questionId);
      setSaveState('saved');
    } catch (error) {
      addPending(questionId, payload);
      setSaveState('pending');
    }
  }

  async function flushPending(snapshot = answers) {
    const pending = readJson(pendingKey, {});
    const entries = Object.entries(pending);
    if (!entries.length || syncing) return;
    setSyncing(true);
    try {
      for (const [questionId, payload] of entries) {
        const latest = snapshot[questionId] || payload;
        await api.post(`/attempts/${attemptId}/answer`, { questionId: Number(questionId), ...latest });
        removePending(Number(questionId));
      }
      setSaveState('saved');
    } catch (error) {
      setSaveState('pending');
    } finally {
      setSyncing(false);
    }
  }

  function addPending(questionId, payload) {
    writeJson(pendingKey, { ...readJson(pendingKey, {}), [questionId]: payload });
  }

  function removePending(questionId) {
    const pending = readJson(pendingKey, {});
    delete pending[questionId];
    writeJson(pendingKey, pending);
  }

  async function submit(auto = false) {
    if (!auto && !allAnswered) return;
    if (!auto && !window.confirm('Selesaikan kuis sekarang?')) return;
    await flushPending(answers);
    await api.post(`/attempts/${attemptId}/submit`);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(pendingKey);
    navigate(`/result/${attemptId}`);
  }

  if (!quiz) return <div className="panel">Memuat tryout...</div>;

  return (
    <section className="tryout-layout">
      <div className="tryout-main panel">
        <div className="tryout-head">
          <strong>{quiz.title}</strong>
          <div className="tryout-status">
            <small>{saveState === 'saved' ? 'Tersimpan otomatis' : saveState === 'saving' ? 'Menyimpan...' : 'Tersimpan lokal, menunggu koneksi'}</small>
            <span className={secondsLeft < 300 ? 'timer danger' : 'timer'}>{timer}</span>
          </div>
        </div>
        <p className="question-text">{active + 1}. {question.text}</p>
        <div className="answer-list">
          {question.options.map((option) => (
            <button key={option.label} className={answers[question.id]?.answer === option.label ? 'selected' : ''} onClick={() => answer(option.label)}>
              <strong>{option.label}</strong>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="button ghost" onClick={toggleDoubt}><Flag size={16} /> Ragu-ragu</button>
          <button className="button secondary" disabled={active === 0} onClick={() => setActive(active - 1)}>Sebelumnya</button>
          <button className="button secondary" disabled={active === quiz.questions.length - 1} onClick={() => setActive(active + 1)}>Berikutnya</button>
          <button className="button primary" disabled={!allAnswered} title={!allAnswered ? `Jawab semua soal dulu: ${answeredCount}/${quiz.questions.length}` : 'Submit kuis'} onClick={() => submit(false)}><Send size={16} /> Selesai</button>
        </div>
        {!allAnswered && <div className="notice muted">Tombol selesai aktif setelah semua soal dijawab. Terjawab {answeredCount}/{quiz.questions.length}.</div>}
      </div>
      <aside className="number-panel">
        {quiz.questions.map((item, index) => {
          const state = answers[item.id];
          return <button key={item.id} className={`${index === active ? 'active' : ''} ${state?.answer ? 'answered' : ''} ${state?.isDoubtful ? 'doubt' : ''}`} onClick={() => setActive(index)}>{index + 1}</button>;
        })}
      </aside>
    </section>
  );
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback;
  } catch {
    return fallback;
  }
}

function readLocalAnswers(key) {
  return readJson(key, {});
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
