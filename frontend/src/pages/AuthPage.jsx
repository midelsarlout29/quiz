import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../state/ToastContext';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: isRegister ? 'peserta@smartquiz.test' : 'guru@smartquiz.test',
    password: 'password123',
    role: 'participant'
  });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const user = isRegister ? await register(form) : await login(form.email, form.password);
      showToast(isRegister ? 'Akun berhasil dibuat.' : 'Login berhasil.', 'success');
      navigate(user.role === 'admin' || user.role === 'super_admin' ? '/admin' : user.role === 'creator' ? '/creator' : '/participant');
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      showToast(message, 'error');
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link className="brand auth-brand" to="/"><img src="/logo.svg" alt="Smart Quiz Generator" /></Link>
        <h1>{isRegister ? 'Daftar akun' : 'Masuk'}</h1>
        {isRegister && (
          <>
            <label>Nama<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="participant">Peserta</option>
                <option value="creator">Pembuat kuis / Guru / Dosen</option>
              </select>
            </label>
          </>
        )}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {error && <div className="alert">{error}</div>}
        <button className="button primary full">{isRegister ? 'Daftar' : 'Masuk'}</button>
        <p>{isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Masuk' : 'Daftar'}</Link></p>
      </form>
    </main>
  );
}
