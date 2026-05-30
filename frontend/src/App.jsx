import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import CategoriesPage from './pages/CategoriesPage';
import CreatorDashboard from './pages/CreatorDashboard';
import ExplanationPage from './pages/ExplanationPage';
import GeneratePage from './pages/GeneratePage';
import LandingPage from './pages/LandingPage';
import MaterialUploadPage from './pages/MaterialUploadPage';
import ParticipantDashboard from './pages/ParticipantDashboard';
import QuestionEditorPage from './pages/QuestionEditorPage';
import QuizListPage from './pages/QuizListPage';
import ReportsPage from './pages/ReportsPage';
import ResultPage from './pages/ResultPage';
import TryoutPage from './pages/TryoutPage';
import UsersPage from './pages/UsersPage';
import { useAuth } from './state/AuthContext';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  if (user.role === 'admin' || user.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (user.role === 'creator') return <Navigate to="/creator" replace />;
  return <Navigate to="/participant" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="route-transition" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/creator" element={<CreatorDashboard />} />
            <Route path="/creator/upload" element={<MaterialUploadPage />} />
            <Route path="/creator/generate" element={<GeneratePage />} />
            <Route path="/creator/questions/:quizId" element={<QuestionEditorPage />} />
            <Route path="/participant" element={<ParticipantDashboard />} />
            <Route path="/quizzes" element={<QuizListPage />} />
            <Route path="/tryout/:quizId/:attemptId" element={<TryoutPage />} />
            <Route path="/result/:attemptId" element={<ResultPage />} />
            <Route path="/explanations/:attemptId" element={<ExplanationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}
