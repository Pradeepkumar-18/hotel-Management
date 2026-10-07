import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ACCESS_EVENT, request, setCsrfToken, StaffMe } from '../api';
import { useToast } from '../ui-feedback';
import { dashboardNav, navGroups } from '../routes/route-config';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  staff: StaffMe;
  setStaff: (staff: StaffMe | null) => void;
  children: React.ReactNode;
}

export function AppLayout({ staff, setStaff, children }: AppLayoutProps) {
  const [mobileNav, setMobileNav] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('staywise-admin-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    const targets = [dashboardNav, ...navGroups.flatMap(group => group.items)].filter(item => staff?.permissions.includes(item.permission));
    const match = targets.find(item => item.label.toLowerCase().includes(query));
    if (match) {
      navigate(match.to);
      setSearchQuery('');
    } else toast.info(`No accessible page matches “${searchQuery.trim()}”.`);
  };

  const logout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not close the staff session cleanly.');
    } finally {
      setCsrfToken('');
      setStaff(null);
      navigate('/admin/login');
    }
  };

  React.useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    try {
      localStorage.setItem('staywise-admin-sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      /* Sidebar preference optional */
    }
  }, [sidebarCollapsed]);

  React.useEffect(() => {
    const handleApiAccess = (event: Event) => {
      const status = (event as CustomEvent<{ status: number }>).detail?.status;
      if (status === 401) {
        setCsrfToken('');
        setStaff(null);
        navigate('/admin/login', { replace: true, state: { from: location.pathname } });
      } else if (status === 403) {
        navigate('/admin/unauthorized', { replace: true, state: { from: location.pathname } });
      }
    };
    window.addEventListener(API_ACCESS_EVENT, handleApiAccess);
    return () => window.removeEventListener(API_ACCESS_EVENT, handleApiAccess);
  }, [location.pathname, navigate, setStaff]);

  return (
    <div className="min-h-screen bg-[#f4f6f3] flex text-[#20322d] antialiased font-sans">
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
          mobileNav={mobileNav}
          setMobileNav={setMobileNav}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          submitSearch={submitSearch}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          logout={logout}
        />
        <section className="max-w-[1600px] w-full mx-auto p-4 sm:p-5 lg:p-6 flex-1">{children}</section>
      </main>
    </div>
  );
}
