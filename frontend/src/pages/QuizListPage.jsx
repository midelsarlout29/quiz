import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Edit, Play } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../state/AuthContext';

export default function QuizListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => { api.get('/quizzes').then((res) => setQuizzes(res.data)); }, []);

  async function start(quizId) {
    const response = await api.post(`/quizzes/${quizId}/start`);
    navigate(`/tryout/${quizId}/${response.data.id}`);
  }

  return (
    <section>
      <div className="page-title"><h1>Daftar Kuis</h1><p>Kuis publik untuk peserta dan kuis milik pembuat.</p></div>
      <div className="quiz-grid">
        {quizzes.map((quiz) => (
          <article className="quiz-card" key={quiz.id}>
            <div><span className={`status ${quiz.status.toLowerCase()}`}>{quiz.status}</span><strong>{quiz.title}</strong></div>
            <p>{quiz.description || 'Tidak ada deskripsi'}</p>
            <div className="meta"><span>{quiz.category.name}</span><span><Clock size={14} /> {quiz.durationMinutes} menit</span><span>PG {quiz.passingGrade}</span></div>
            {user.role === 'participant' ? (
              <button className="button primary" onClick={() => start(quiz.id)}><Play size={16} /> Mulai</button>
            ) : (
              <Link className="button secondary" to={`/creator/questions/${quiz.id}`}><Edit size={16} /> Edit soal</Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
