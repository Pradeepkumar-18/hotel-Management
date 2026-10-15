import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Search, ShieldAlert } from 'lucide-react';
import { StaffMe } from '../api';
import { useToast } from '../ui-feedback';

export function Topbar({
  staff,
  setMobileNav,
  logout,
  logoutAll,
}: {
  staff: StaffMe;
  setMobileNav: (value: boolean) => void;
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

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-line flex items-center justify-between px-6 md:px-8 shadow-2xs">
      <button
        type="button"
        className="md:hidden p-2 text-ink-muted hover:text-ink rounded-lg hover:bg-canvas transition-colors mr-2 cursor-pointer"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* Search Input */}
      <form
        className="flex items-center gap-3 px-3.5 py-2 bg-white border border-line rounded-xl text-ink-muted w-full max-w-xs md:max-w-md focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all shadow-2xs h-10"
        role="search"
        onSubmit={submitSearch}
      >
        <Search size={16} className="text-ink-muted shrink-0" />
        <input
          className="w-full bg-transparent border-none text-sm text-ink-deep placeholder-ink-muted focus:outline-none font-medium"
          aria-label="Search workspace pages"
          placeholder="Search anything..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono text-ink-faint bg-surface-subtle border border-line-subtle rounded shadow-2xs">
          ↵
        </kbd>
      </form>

      {/* Right Topbar Icons & Profile */}
      <div className="flex items-center gap-3.5">
        <button
          className="relative p-2.5 text-ink-muted hover:text-ink hover:bg-surface-muted rounded-xl transition-colors cursor-pointer"
          type="button"
          aria-label="Notifications"
          title="Notifications are coming soon"
          onClick={() => toast.info('Notifications are coming soon.')}
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger ring-2 ring-white" />
        </button>

        <div className="relative pl-3.5 border-l border-line">
          <button
            className={`flex items-center gap-3 p-1.5 pr-3 rounded-xl border text-left transition-all cursor-pointer ${
              profileOpen
                ? 'border-brand-border bg-surface-muted'
                : 'border-transparent hover:border-line hover:bg-surface-muted'
            }`}
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((value) => !value)}
          >
            <span className="w-9 h-9 rounded-full bg-brand-pale text-brand-primary font-bold text-sm flex items-center justify-center shrink-0 border border-brand-border">
              {staff.user.email.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:flex flex-col min-w-0">
              <b className="text-[13px] font-bold text-ink-deep truncate max-w-[155px]">{staff.user.email}</b>
              <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider leading-none mt-0.5">
                {staff.roles[0]?.replaceAll('_', ' ') || 'Staff'}
              </span>
            </span>
            <ChevronDown size={15} className="text-ink-muted shrink-0 hidden sm:block" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-line rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="flex items-center gap-3 p-2.5 bg-surface-muted rounded-lg">
                <span className="w-9 h-9 rounded-full bg-brand-pale text-brand-primary font-bold text-sm flex items-center justify-center shrink-0 border border-brand-border">
                  {staff.user.email.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex flex-col min-w-0">
                  <b className="text-xs font-bold text-ink truncate">{staff.user.email}</b>
                  <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider leading-tight mt-0.5">
                    {staff.roles[0]?.replaceAll('_', ' ') || 'Staff account'}
                  </span>
                </span>
              </div>
              <div className="my-2 border-t border-line" />
              <button
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-ink-deep hover:bg-danger-pale hover:text-danger transition-colors text-left cursor-pointer"
                role="menuitem"
                onClick={logout}
              >
                <span className="w-7 h-7 rounded-md bg-surface-muted flex items-center justify-center text-ink-muted shrink-0">
                  <LogOut size={15} />
                </span>
                <span>Sign out</span>
              </button>
              {logoutAll && (
                <button
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-ink-deep hover:bg-danger-pale hover:text-danger transition-colors text-left cursor-pointer mt-1"
                  role="menuitem"
                  onClick={logoutAll}
                >
                  <span className="w-7 h-7 rounded-md bg-surface-muted flex items-center justify-center text-ink-muted shrink-0">
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
