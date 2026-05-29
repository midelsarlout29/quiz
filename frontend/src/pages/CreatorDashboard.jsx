import { Link } from 'react-router-dom';
import { BookOpen, FileUp, PencilLine, Send } from 'lucide-react';

export default function CreatorDashboard() {
  return (
    <section>
      <div className="page-title"><h1>Dashboard Pembuat Kuis</h1><p>Buat kuis manual atau generate dari materi.</p></div>
      <div className="workflow-grid">
        <Link to="/creator/upload"><FileUp /><strong>Upload Materi</strong><span>PDF, DOCX, TXT</span></Link>
        <Link to="/creator/generate"><BookOpen /><strong>Generate Soal</strong><span>50 sampai 100 soal</span></Link>
        <Link to="/quizzes"><PencilLine /><strong>Edit & Publish</strong><span>Periksa soal sebelum digunakan</span></Link>
        <Link to="/reports"><Send /><strong>Laporan</strong><span>Rekap nilai dan export</span></Link>
      </div>
    </section>
  );
}
