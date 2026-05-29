import { useEffect, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api, errorMessage } from '../api/client';

export default function MaterialUploadPage() {
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await api.get('/materials');
    setMaterials(response.data);
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    try {
      await api.post('/materials/upload', form);
      setTitle('');
      setFile(null);
      setMessage('Materi berhasil diupload dan diekstrak.');
      load();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <section>
      <div className="page-title"><h1>Upload Materi</h1><p>File divalidasi, diekstrak, dan disanitasi sebelum dipakai generator.</p></div>
      <form className="panel form-grid" onSubmit={submit}>
        <label>Judul materi<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>File PDF, DOCX, TXT<input type="file" accept=".pdf,.docx,.txt" onChange={(event) => setFile(event.target.files[0])} required /></label>
        <button className="button primary"><UploadCloud size={17} /> Upload</button>
        {message && <div className="notice">{message}</div>}
      </form>
      <div className="panel">
        <h2>Materi tersimpan</h2>
        <div className="table">
          {materials.map((material) => (
            <div className="tr" key={material.id}>
              <span>{material.title}</span><span>{material.originalName}</span><strong>{material.sanitizedText.length} karakter</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
