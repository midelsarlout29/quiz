import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import StatCard from '../components/StatCard';

export default function ResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  useEffect(() => { api.get(`/attempts/${attemptId}/result`).then((res) => setResult(res.data)); }, [attemptId]);
  if (!result) return <div className="panel">Memuat hasil...</div>;
  return (
    <section>
      <div className="page-title"><h1>Hasil Nilai</h1><p>{result.quiz.title}</p></div>
      <div className="stats-grid">
        <StatCard label="Benar" value={result.correctCount} tone="green" />
        <StatCard label="Salah" value={result.wrongCount} tone="red" />
        <StatCard label="Tidak dijawab" value={result.unansweredCount} tone="yellow" />
        <StatCard label="Nilai akhir" value={result.score.toFixed(1)} />
      </div>
      <div className="panel result-banner">
        <strong>{result.passed ? 'Lulus' : 'Tidak lulus'}</strong>
        <span>Passing grade {result.quiz.passingGrade}. Ranking: {result.ranking?.rank || '-'}</span>
        <Link className="button primary" to={`/explanations/${attemptId}`}>Lihat pembahasan</Link>
      </div>
    </section>
  );
}
