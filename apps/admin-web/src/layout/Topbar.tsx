import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, PanelLeft, Search, ShieldAlert } from 'lucide-react';
import { StaffMe } from '../api';
import { useToast } from '../ui-feedback';
import { Input } from '../components/ui';

export function Topbar({
  staff,
  setMobileNav,
  sidebarCollapsed,
  setSidebarCollapsed,
  logout,
  logoutAll,
}: {
  staff: StaffMe;
  setMobileNav: (value: boolean) => void;
  sidebarCollapsed?: boolean;
  setSidebarCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => Promise<void>;
  logoutAll?: () => Promise<void>;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/hotels?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const initialLetter = staff.user.email.slice(0, 1).toUpperCase();
  const roleDisplay = staff.roles[0]?.replaceAll('_', ' ') || 'SUPER ADMIN';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 md:px-8 shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile Nav Toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => setMobileNav(true)}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        {/* Desktop Sidebar Toggle */}
        {setSidebarCollapsed && (
          <button
            type="button"
            className={`hidden md:inline-flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${
              sidebarCollapsed
                ? 'text-brand-primary bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/60 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
            }`}
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft size={19} />
          </button>
        )}

        {/* Search Input */}
        <form className="w-64 sm:w-80 md:w-96" role="search" onSubmit={submitSearch}>
          {/* Only hotels are searchable today; the placeholder says so. */}
          <Input
            type="search"
            maxLength={100}
            aria-label="Search hotels"
            placeholder="Search hotels…"
            leftIcon={<Search size={15} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
      </div>

      {/* Right Topbar Icons & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <button
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          type="button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => toast.info('No new notifications.')}
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="relative pl-3 border-l border-slate-200">
          <button
            className={`flex items-center gap-3 p-1.5 pr-2 rounded-xl text-left transition-all cursor-pointer ${
              profileOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
            }`}
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((value) => !value)}
          >
            <span className="w-9 h-9 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-sm flex items-center justify-center shrink-0">
              {initialLetter}
            </span>
            <span className="hidden sm:flex flex-col min-w-0">
              <b className="text-xs font-bold text-slate-900 truncate max-w-[150px] leading-tight">
                {staff.user.email}
              </b>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                {roleDisplay}
              </span>
            </span>
            <ChevronDown size={14} className="text-slate-400 shrink-0 hidden sm:block ml-1" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                <span className="w-9 h-9 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-sm flex items-center justify-center shrink-0">
                  {initialLetter}
                </span>
                <span className="flex flex-col min-w-0">
                  <b className="text-xs font-bold text-slate-900 truncate">{staff.user.email}</b>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
                    {roleDisplay}
                  </span>
                </span>
              </div>
              <div className="my-2 border-t border-slate-100" />
              <button
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left cursor-pointer"
                role="menuitem"
                onClick={logout}
              >
                <span className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <LogOut size={15} />
                </span>
                <span>Sign out</span>
              </button>
              {logoutAll && (
                <button
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left cursor-pointer mt-1"
                  role="menuitem"
                  onClick={logoutAll}
                >
                  <span className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <ShieldAlert size={15} />
                  </span>
                  <span>Sign out everywhere</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
