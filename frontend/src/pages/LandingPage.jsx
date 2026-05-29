import { ArrowRight, BookOpenCheck, FileUp, Timer, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <img className="hero-logo" src="/logo.svg" alt="Smart Quiz Generator" />
          <p>Platform kuis, tryout, dan evaluasi berbasis materi</p>
          <h1>Smart Quiz Generator</h1>
          <span>
            Upload materi, hasilkan bank soal, edit, publish, kerjakan tryout, nilai otomatis,
            pembahasan lengkap, dan laporan siap ekspor.
          </span>
          <div className="hero-actions">
            <Link className="button primary" to="/login">
              Masuk
              <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" to="/register">
              Daftar
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="tryout-preview">
            <div className="preview-head">
              <strong>Tryout Literasi Digital</strong>
              <span>32:18</span>
            </div>
            <p>Apa tujuan utama literasi digital?</p>
            {['A. Menggunakan teknologi secara etis', 'B. Menghafal perangkat keras', 'C. Menghindari internet', 'D. Membagikan data pribadi'].map((item, index) => (
              <div className={index === 0 ? 'option selected' : 'option'} key={item}>{item}</div>
            ))}
            <div className="number-strip">{Array.from({ length: 12 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
          </div>
        </div>
      </section>
      <section className="feature-band">
        <article><FileUp size={22} /><strong>Upload Materi</strong><span>PDF, DOCX, TXT</span></article>
        <article><BookOpenCheck size={22} /><strong>Generate Soal</strong><span>50, 75, 100 soal</span></article>
        <article><Timer size={22} /><strong>Tryout</strong><span>Timer dan autosave</span></article>
        <article><Users size={22} /><strong>Multi Role</strong><span>Admin, guru, peserta</span></article>
      </section>
    </main>
  );
}
