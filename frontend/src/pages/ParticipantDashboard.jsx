import { Link } from 'react-router-dom';

export default function ParticipantDashboard() {
  return (
    <section className="panel spacious">
      <h1>Dashboard Peserta</h1>
      <p>Pilih kuis publik, kerjakan tryout dengan timer, lalu lihat nilai dan pembahasan setelah submit.</p>
      <Link className="button primary" to="/quizzes">Lihat Daftar Kuis</Link>
    </section>
  );
}
