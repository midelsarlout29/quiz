import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import StatCard from '../components/StatCard';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  useEffect(() => { api.get('/reports/summary').then((res) => setSummary(res.data)); }, []);
  const chartData = (summary?.bestParticipants || []).map((item) => ({ name: item.participant.name, nilai: Number(item.score.toFixed(1)) }));

  async function download(path, filename) {
    const response = await api.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="page-title"><h1>Laporan dan Statistik</h1><p>Grafik nilai, rekap hasil, soal paling banyak salah, peserta terbaik, export PDF/CSV.</p></div>
      <div className="stats-grid">
        <StatCard label="Kuis" value={summary?.quizzes ?? '-'} />
        <StatCard label="Attempt" value={summary?.attempts ?? '-'} tone="green" />
        <StatCard label="Rata-rata" value={(summary?.averageScore || 0).toFixed(1)} tone="yellow" />
      </div>
      <div className="panel chart-panel">
        <h2>Peserta terbaik</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="nilai" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="actions">
        <button className="button secondary" onClick={() => download('/reports/export.csv', 'laporan-hasil.csv')}>Export CSV</button>
        <button className="button primary" onClick={() => download('/reports/export.pdf', 'laporan-hasil.pdf')}>Export PDF</button>
      </div>
    </section>
  );
}
