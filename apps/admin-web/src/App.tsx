import { Navigate, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from './features/auth/AuthContext';
import { Spinner } from './ui-feedback';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './layout/AppLayout';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const { staff, loading, apiError, setStaffUser } = useAuth();

  if (loading) {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <span className="brand-mark">
          <Compass size={21} />
        </span>
        <Spinner size={20} />
        <span>Opening Staywise</span>
      </div>
    );
  }

  if (!staff) {
    return (
      <Routes>
        <Route path="/admin/login" element={<LoginPage onLogin={setStaffUser} apiError={apiError} />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout staff={staff} setStaff={setStaffUser}>
      <AppRoutes staff={staff} />
    </AppLayout>
  );
}
