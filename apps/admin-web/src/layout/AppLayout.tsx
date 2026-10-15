import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StaffMe } from '../api';
import { useAuth } from '../features/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ErrorBoundary } from '../components/ui';

interface AppLayoutProps {
  staff: StaffMe;
  setStaff: (staff: StaffMe | null) => void;
  children: React.ReactNode;
}

export function AppLayout({ staff, children }: AppLayoutProps) {
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('staywise-admin-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const location = useLocation();
  const { logout, logoutAll } = useAuth();

  React.useEffect(() => {
    try {
      localStorage.setItem('staywise-admin-sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      /* Sidebar preference optional */
    }
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen bg-canvas flex text-ink antialiased font-sans">
      <Sidebar
        staff={staff}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        collapsedGroups={collapsedGroups}
        setCollapsedGroups={setCollapsedGroups}
      />
      <main className={`flex-1 min-w-0 flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-68'}`}>
        <Topbar
          staff={staff}
          setMobileNav={setMobileNav}
          logout={logout}
          logoutAll={logoutAll}
        />
        <section className="max-w-[1600px] w-full mx-auto p-4 sm:p-5 lg:p-6 flex-1">
          <ErrorBoundary resetKey={location.pathname}>
            {children}
          </ErrorBoundary>
        </section>
      </main>
    </div>
  );
}
