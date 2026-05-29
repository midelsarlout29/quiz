import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function ExplanationPage() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/attempts/${attemptId}/explanations`).then((res) => setData(res.data)); }, [attemptId]);
  if (!data) return <div className="panel">Memuat pembahasan...</div>;
  return (
    <section>
      <div className="page-title"><h1>Pembahasan Jawaban</h1><p>Hijau benar, merah salah, kuning ragu-ragu.</p></div>
      <div className="explanation-list">
        {data.questions.map((question, index) => (
          <article className={`panel explanation ${question.isCorrect ? 'correct' : 'wrong'} ${question.isDoubtful ? 'doubt' : ''}`} key={question.id}>
            <h2>{index + 1}. {question.text}</h2>
            <p>Jawaban peserta: <strong>{question.participantAnswer || 'Tidak dijawab'}</strong> | Jawaban benar: <strong>{question.correctAnswer}</strong></p>
            {question.options.map((option) => <div className={option.label === question.correctAnswer ? 'option-row true' : option.label === question.participantAnswer ? 'option-row false' : 'option-row'} key={option.id}><strong>{option.label}</strong><span>{option.text}</span><small>{option.explanation}</small></div>)}
            <p className="explain">{question.explanation?.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
