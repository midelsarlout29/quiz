import { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../state/ToastContext';

export default function QuestionEditorPage() {
  const { showToast } = useToast();
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [active, setActive] = useState(0);
  const question = quiz?.questions?.[active];

  async function load() {
    const response = await api.get(`/quizzes/${quizId}`);
    setQuiz(response.data);
  }

  useEffect(() => { load(); }, [quizId]);

  function updateQuestion(patch) {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((item, index) => index === active ? { ...item, ...patch } : item)
    });
  }

  function updateOption(label, patch) {
    updateQuestion({
      options: question.options.map((option) => option.label === label ? { ...option, ...patch } : option)
    });
  }

  function updateQuizSettings(patch) {
    setQuiz({ ...quiz, ...patch });
  }

  async function saveQuizSettings() {
    await api.put(`/quizzes/${quizId}`, {
      title: quiz.title,
      description: quiz.description || '',
      categoryId: quiz.categoryId,
      materialId: quiz.materialId,
      durationMinutes: Number(quiz.durationMinutes),
      passingGrade: Number(quiz.passingGrade),
      showResultDirectly: Boolean(quiz.showResultDirectly),
      isPublic: Boolean(quiz.isPublic),
      accessCode: quiz.accessCode || undefined
    });
    showToast('Pengaturan kuis berhasil disimpan.', 'success');
    load();
  }

  async function save() {
    await api.put(`/questions/${question.id}`, {
      text: question.text,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      topic: question.topic,
      categoryId: question.categoryId,
      explanation: question.explanation?.content,
      options: question.options
    });
    showToast('Soal berhasil disimpan.', 'success');
    load();
  }

  async function publish() {
    const response = await api.post(`/quizzes/${quizId}/publish`);
    showToast(`Kuis berhasil dipublish. Kode: ${response.data.accessCode}`, 'success');
    load();
  }

  if (!quiz) return <div className="panel">Memuat soal...</div>;

  return (
    <section>
      <div className="page-title">
        <h1>Edit Soal</h1>
        <p>{quiz.title} - {quiz.questions.length} soal - status {quiz.status}</p>
      </div>
      <div className="panel form-grid">
        <h2>Pengaturan Kuis</h2>
        <div className="settings-grid">
          <label>Judul kuis
            <input value={quiz.title} onChange={(e) => updateQuizSettings({ title: e.target.value })} />
          </label>
          <label>Durasi pengerjaan (menit)
            <input type="number" min="1" value={quiz.durationMinutes} onChange={(e) => updateQuizSettings({ durationMinutes: e.target.value })} />
          </label>
          <label>Passing grade
            <input type="number" min="0" max="100" value={quiz.passingGrade} onChange={(e) => updateQuizSettings({ passingGrade: e.target.value })} />
          </label>
          <label>Deskripsi
            <input value={quiz.description || ''} onChange={(e) => updateQuizSettings({ description: e.target.value })} />
          </label>
          <label>Kode kuis
            <input value={quiz.accessCode || ''} onChange={(e) => updateQuizSettings({ accessCode: e.target.value.toUpperCase() })} placeholder="Otomatis dibuat saat publish" />
          </label>
        </div>
        <div className="toggle-row">
          <label><input type="checkbox" checked={quiz.showResultDirectly} onChange={(e) => updateQuizSettings({ showResultDirectly: e.target.checked })} /> Hasil langsung ditampilkan</label>
          <label><input type="checkbox" checked={quiz.isPublic} onChange={(e) => updateQuizSettings({ isPublic: e.target.checked })} /> Kuis publik</label>
        </div>
        <div className="actions">
          <button className="button secondary" onClick={saveQuizSettings}>Simpan pengaturan kuis</button>
        </div>
      </div>
      <div className="editor-layout">
        <aside className="question-nav">
          {quiz.questions.map((item, index) => (
            <button className={index === active ? 'active' : ''} key={item.id} onClick={() => setActive(index)}>{index + 1}</button>
          ))}
        </aside>
        <div className="panel form-grid editor-panel">
          <label>Pertanyaan<textarea value={question.text} onChange={(e) => updateQuestion({ text: e.target.value })} /></label>
          <div className="two-col">
            <label>Topik<input value={question.topic || ''} onChange={(e) => updateQuestion({ topic: e.target.value })} /></label>
            <label>Kesulitan<select value={question.difficulty} onChange={(e) => updateQuestion({ difficulty: e.target.value })}><option value="MUDAH">Mudah</option><option value="SEDANG">Sedang</option><option value="SULIT">Sulit</option></select></label>
          </div>
          {question.options.map((option) => (
            <label key={option.label}>{option.label}
              <input value={option.text} onChange={(e) => updateOption(option.label, { text: e.target.value })} />
              <small><input type="radio" checked={question.correctAnswer === option.label} onChange={() => updateQuestion({ correctAnswer: option.label })} /> Jawaban benar</small>
              <input value={option.explanation || ''} onChange={(e) => updateOption(option.label, { explanation: e.target.value })} placeholder="Pembahasan opsi" />
            </label>
          ))}
          <label>Penjelasan<textarea value={question.explanation?.content || ''} onChange={(e) => updateQuestion({ explanation: { ...question.explanation, content: e.target.value } })} /></label>
          <div className="actions">
            <button className="button secondary" onClick={save}><Save size={16} /> Simpan soal</button>
            <button className="button primary" onClick={publish}><Send size={16} /> Publish kuis</button>
            <Link className="button ghost" to="/quizzes">Daftar kuis</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
