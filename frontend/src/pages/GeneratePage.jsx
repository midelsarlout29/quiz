import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { api, errorMessage } from '../api/client';

export default function GeneratePage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    materialId: '',
    categoryId: '',
    questionCount: 50,
    difficulty: 'sedang',
    questionType: 'multiple_choice',
    language: 'id',
    quizTitle: ''
  });

  useEffect(() => {
    Promise.all([api.get('/materials'), api.get('/categories')]).then(([materialRes, categoryRes]) => {
      setMaterials(materialRes.data);
      setCategories(categoryRes.data);
      setForm((current) => ({
        ...current,
        materialId: materialRes.data[0]?.id || '',
        categoryId: categoryRes.data[0]?.id || ''
      }));
    });
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const quizTitle = form.quizTitle.trim();
      const response = await api.post(`/materials/${form.materialId}/generate`, {
        ...form,
        quizTitle: quizTitle || undefined,
        categoryId: Number(form.categoryId),
        questionCount: Number(form.questionCount)
      });
      navigate(`/creator/questions/${response.data.quiz.id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-title"><h1>Generate Soal Otomatis</h1><p>Pilih materi, jumlah soal, tipe, bahasa, dan tingkat kesulitan.</p></div>
      <form className="panel form-grid" onSubmit={submit}>
        <label>Materi<select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>{materials.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Kategori<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Judul kuis<input value={form.quizTitle} onChange={(e) => setForm({ ...form, quizTitle: e.target.value })} placeholder="Opsional" /></label>
        <label>Jumlah soal<select value={form.questionCount} onChange={(e) => setForm({ ...form, questionCount: e.target.value })}><option>50</option><option>75</option><option>100</option></select></label>
        <label>Tipe soal<select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value })}><option value="multiple_choice">Pilihan ganda</option><option value="true_false">Benar/Salah</option><option value="short_answer">Isian singkat</option></select></label>
        <label>Kesulitan<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="mudah">Mudah</option><option value="sedang">Sedang</option><option value="sulit">Sulit</option></select></label>
        {error && <div className="alert">{error}</div>}
        <button className="button primary" disabled={busy}><Wand2 size={17} /> {busy ? 'Membuat soal...' : 'Generate'}</button>
      </form>
    </section>
  );
}
