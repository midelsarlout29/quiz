import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Copy, Edit, KeyRound, Play, PlusCircle, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../state/ToastContext';

export default function QuizListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [codes, setCodes] = useState({});

  async function load() {
    const response = await api.get('/quizzes');
    setQuizzes(response.data);
  }

  useEffect(() => { load(); }, []);

  async function start(quiz) {
    try {
      const accessCode = (codes[quiz.id] || '').trim();
      if (!accessCode) {
        showToast('Masukkan kode kuis terlebih dahulu.', 'error');
        return;
      }
      const response = await api.post(`/quizzes/${quiz.id}/start`, { accessCode });
      navigate(`/tryout/${quiz.id}/${response.data.id}`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal memulai kuis.', 'error');
    }
  }

  async function deleteQuiz(quiz) {
    if (!window.confirm(`Hapus kuis "${quiz.title}"? Semua attempt dan ranking kuis ini juga akan dihapus.`)) return;
    try {
      await api.delete(`/quizzes/${quiz.id}`);
      showToast('Kuis berhasil dihapus.', 'success');
      load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal menghapus kuis.', 'error');
    }
  }

  async function copyAccessCode(code) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const input = document.createElement('input');
        input.value = code;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      showToast(`Kode kuis ${code} disalin.`, 'success');
    } catch {
      showToast('Kode kuis gagal disalin.', 'error');
    }
  }

  const canManage = ['creator', 'admin', 'super_admin'].includes(user.role);

  return (
    <section>
      <div className="page-title"><h1>Daftar Kuis</h1><p>Kuis publik untuk peserta dan kuis milik pembuat.</p></div>
      <div className="quiz-grid">
        {canManage && (
          <Link className="quiz-card add-quiz-card" to="/creator/generate" aria-label="Tambah kuis">
            <PlusCircle />
          </Link>
        )}
        {quizzes.map((quiz) => (
          <article className="quiz-card" key={quiz.id}>
            <div><span className={`status ${quiz.status.toLowerCase()}`}>{quiz.status}</span><strong>{quiz.title}</strong></div>
            <p>{quiz.description || 'Tidak ada deskripsi'}</p>
            <div className="meta"><span>{quiz.category.name}</span><span><Clock size={14} /> {quiz.durationMinutes} menit</span><span>PG {quiz.passingGrade}</span></div>
            {user.role === 'participant' ? (
              <>
                <label>Kode kuis
                  <input
                    value={codes[quiz.id] || ''}
                    onChange={(event) => setCodes({ ...codes, [quiz.id]: event.target.value.toUpperCase() })}
                    placeholder="Masukkan kode kuis"
                  />
                </label>
                <button className="button primary" onClick={() => start(quiz)}><Play size={16} /> Mulai</button>
              </>
            ) : (
              <div className="actions">
                <Link className="button secondary" to={`/creator/questions/${quiz.id}`}><Edit size={16} /> Edit soal</Link>
                {quiz.accessCode && (
                  <button
                    className="code-badge"
                    type="button"
                    title="Klik untuk salin kode kuis"
                    aria-label={`Salin kode kuis ${quiz.accessCode}`}
                    onClick={() => copyAccessCode(quiz.accessCode)}
                  >
                    <KeyRound size={14} /> {quiz.accessCode} <Copy size={14} />
                  </button>
                )}
                {canManage && <button className="button danger" onClick={() => deleteQuiz(quiz)}><Trash2 size={16} /> Hapus</button>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
