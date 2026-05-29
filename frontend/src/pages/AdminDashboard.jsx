import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  useEffect(() => { api.get('/reports/summary').then((res) => setSummary(res.data)); }, []);

  return (
    <section>
      <div className="page-title"><h1>Dashboard Admin</h1><p>Kelola pengguna, kategori, bank soal, kuis, hasil, dan performa.</p></div>
      <div className="stats-grid">
        <StatCard label="Peserta" value={summary?.participants ?? '-'} />
        <StatCard label="Kuis" value={summary?.quizzes ?? '-'} tone="green" />
        <StatCard label="Attempt selesai" value={summary?.attempts ?? '-'} tone="yellow" />
        <StatCard label="Rata-rata nilai" value={(summary?.averageScore || 0).toFixed(1)} tone="red" />
      </div>
      <div className="panel">
        <h2>Peserta terbaik</h2>
        <div className="table">
          {(summary?.bestParticipants || []).map((item) => (
            <div className="tr" key={`${item.participant.name}-${item.quiz.title}`}>
              <span>{item.participant.name}</span><span>{item.quiz.title}</span><strong>{item.score.toFixed(1)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
