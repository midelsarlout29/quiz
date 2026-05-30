import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, FileText, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatCard from '../components/StatCard';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatDuration(seconds) {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} menit ${rest} detik`;
}

export default function ParticipantDashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attempts/mine/results')
      .then((response) => setResults(response.data))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const completed = results.length;
    const passed = results.filter((item) => item.passed).length;
    const average = completed
      ? results.reduce((total, item) => total + Number(item.score || 0), 0) / completed
      : 0;
    const best = completed ? Math.max(...results.map((item) => Number(item.score || 0))) : 0;
    return { completed, passed, average, best };
  }, [results]);

  return (
    <section>
      <div className="page-title">
        <h1>Dashboard Peserta</h1>
        <p>Pilih kuis publik, kerjakan tryout dengan timer, lalu pantau hasil ujian yang sudah selesai.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Ujian selesai" value={summary.completed} />
        <StatCard label="Lulus" value={summary.passed} tone="green" />
        <StatCard label="Rata-rata nilai" value={summary.average.toFixed(1)} tone="yellow" />
        <StatCard label="Nilai terbaik" value={summary.best.toFixed(1)} tone="green" />
      </div>

      <div className="panel participant-hero">
        <div>
          <h2>Mulai tryout baru</h2>
          <p>Pilih kuis yang tersedia, masukkan kode kuis, lalu lanjutkan pengerjaan.</p>
        </div>
        <Link className="button primary" to="/quizzes"><BookOpen size={16} /> Lihat Daftar Kuis</Link>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h2>Hasil Ujian Terakhir</h2>
            <p>Riwayat kuis yang sudah disubmit atau otomatis selesai karena waktu habis.</p>
          </div>
        </div>

        {loading ? (
          <div className="notice">Memuat hasil ujian...</div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <Trophy size={40} />
            <strong>Belum ada hasil ujian</strong>
            <span>Hasil akan muncul setelah Anda menyelesaikan kuis.</span>
          </div>
        ) : (
          <div className="result-list">
            {results.map((attempt) => (
              <article className="result-item" key={attempt.id}>
                <div>
                  <span className={`status ${attempt.passed ? 'published' : ''}`}>
                    {attempt.passed ? 'Lulus' : 'Tidak lulus'}
                  </span>
                  <strong>{attempt.quiz.title}</strong>
                  <div className="meta">
                    <span>{attempt.quiz.category?.name || 'Umum'}</span>
                    <span><Clock size={14} /> {formatDate(attempt.submittedAt)}</span>
                    <span>{formatDuration(attempt.durationSeconds)}</span>
                    <span>Ranking {attempt.ranking?.rank || '-'}</span>
                  </div>
                </div>
                <div className="score-pill">
                  <span>Nilai</span>
                  <strong>{Number(attempt.score || 0).toFixed(1)}</strong>
                </div>
                <div className="actions">
                  <Link className="button secondary" to={`/result/${attempt.id}`}><CheckCircle2 size={16} /> Hasil</Link>
                  <Link className="button ghost" to={`/explanations/${attempt.id}`}><FileText size={16} /> Pembahasan</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
