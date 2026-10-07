import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { ApiError, request, StaffMe } from './api';
import { Spinner } from './ui-feedback';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './layout/AppLayout';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const [staff, setStaff] = useState<StaffMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      setStaff(await request<StaffMe>('/auth/me'));
      setError('');
    } catch (err) {
      setStaff(null);
      if (!(err instanceof ApiError && err.status === 401)) {
        setError('The Staywise API could not be reached. Check that it is running and try again.');
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (checking) {
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
        <Route path="/admin/login" element={<LoginPage onLogin={setStaff} apiError={error} />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout staff={staff} setStaff={setStaff}>
      <AppRoutes staff={staff} />
    </AppLayout>
  );
}
