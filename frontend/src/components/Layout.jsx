import { BookOpen, FileText, Home, LogOut, Menu, Shield, Trophy, Upload, Users } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const navByRole = {
  admin: [
    ['Dashboard', '/admin', Shield],
    ['Pengguna', '/admin/users', Users],
    ['Kategori', '/admin/categories', BookOpen],
    ['Laporan', '/reports', FileText]
  ],
  creator: [
    ['Dashboard', '/creator', Home],
    ['Upload', '/creator/upload', Upload],
    ['Generate', '/creator/generate', BookOpen],
    ['Kuis', '/quizzes', FileText],
    ['Laporan', '/reports', Trophy]
  ],
  participant: [
    ['Dashboard', '/participant', Home],
    ['Daftar Kuis', '/quizzes', BookOpen]
  ]
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navByRole[user?.role] || [];

  function onLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <img src="/app-icon.svg" alt="Smart Quiz" />
          <strong>Smart Quiz</strong>
        </Link>
        <nav>
          {items.map(([label, to, Icon]) => (
            <NavLink key={to} to={to}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" aria-label="Menu">
            <Menu size={20} />
          </button>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.roleLabel}</small>
          </div>
          <button className="button ghost" onClick={onLogout}>
            <LogOut size={16} />
            Keluar
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
