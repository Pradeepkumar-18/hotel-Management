import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiError, setCsrfToken, StaffMe, API_ACCESS_EVENT } from '../../api';
import { getStaffMe, logoutStaff, logoutAllStaff } from './auth.api';

interface AuthContextValue {
  staff: StaffMe | null;
  loading: boolean;
  apiError: string;
  can: (permission: string) => boolean;
  setStaffUser: (staff: StaffMe | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<StaffMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getStaffMe();
      setStaff(me);
      setApiError('');
    } catch (err) {
      setStaff(null);
      if (!(err instanceof ApiError && err.status === 401)) {
        setApiError('The Staywise API could not be reached. Check that it is running and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutStaff();
    } finally {
      setCsrfToken('');
      setStaff(null);
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllStaff();
    } finally {
      setCsrfToken('');
      setStaff(null);
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const can = useCallback((permission: string): boolean => {
    if (!staff) return false;
    if (staff.roles.includes('SUPER_ADMIN')) return true;
    return staff.permissions.includes(permission);
  }, [staff]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    const handleApiAccess = (event: Event) => {
      const detail = (event as CustomEvent<{ status: number; code?: string }>).detail;
      if (detail?.status === 401 || detail?.code === 'CSRF_REJECTED') {
        setCsrfToken('');
        setStaff(null);
        navigate('/admin/login', {
          replace: true,
          state: { from: location.pathname, reason: 'expired' },
        });
      }
    };
    window.addEventListener(API_ACCESS_EVENT, handleApiAccess);
    return () => window.removeEventListener(API_ACCESS_EVENT, handleApiAccess);
  }, [location.pathname, navigate]);

  return (
    <AuthContext.Provider
      value={{
        staff,
        loading,
        apiError,
        can,
        setStaffUser: setStaff,
        logout,
        logoutAll,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
