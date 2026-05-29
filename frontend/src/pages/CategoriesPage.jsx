import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');

  async function load() {
    const response = await api.get('/categories');
    setCategories(response.data);
  }

  useEffect(() => { load(); }, []);

  async function add(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await api.post('/categories', { name });
    setName('');
    load();
  }

  return (
    <section>
      <div className="page-title"><h1>Kategori Kuis</h1><p>Sekolah, kuliah, CPNS, PPPK, tes kerja, sertifikasi, pelatihan, umum.</p></div>
      <form className="inline-form" onSubmit={add}>
        <input placeholder="Nama kategori" value={name} onChange={(event) => setName(event.target.value)} />
        <button className="button primary">Tambah</button>
      </form>
      <div className="chip-list">
        {categories.map((category) => <span key={category.id}>{category.name}</span>)}
      </div>
    </section>
  );
}
