import React from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react';
import { StaffMe } from '../api';
import { AsyncButton, useToast } from '../ui-feedback';

interface TopbarProps {
  staff: StaffMe;
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  submitSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  profileOpen: boolean;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
}

export function Topbar({
  staff,
  setMobileNav,
  searchQuery,
  setSearchQuery,
  submitSearch,
  profileOpen,
  setProfileOpen,
  logout,
}: TopbarProps) {
  const toast = useToast();

  return (
    <header className="sticky top-0 z-20 h-18 bg-white/95 backdrop-blur-md border-b border-[#e4e9e3] flex items-center justify-between px-5 md:px-8 shadow-2xs">
      <button
        type="button"
        className="md:hidden p-2 text-[#637169] hover:text-[#20322d] rounded-lg hover:bg-[#f4f6f3] transition-colors mr-2 cursor-pointer"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* Search Input */}
      <form
        className="flex items-center gap-3 px-4 py-2 bg-white border border-[#e4e9e4] rounded-xl text-[#809087] w-full max-w-xs md:max-w-md focus-within:border-[#1e6354] focus-within:ring-2 focus-within:ring-[#1e6354]/15 transition-all shadow-2xs min-h-[42px]"
        role="search"
        onSubmit={submitSearch}
      >
        <Search size={18} className="text-[#809087] shrink-0" />
        <input
          className="w-full bg-transparent border-none text-sm text-[#33483d] placeholder-[#99a39d] focus:outline-none font-medium"
          aria-label="Search workspace pages"
          placeholder="Search anything..."
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
        />
        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono text-[#9aa49d] bg-[#fafbf9] border border-[#e7ebe7] rounded shadow-2xs">↵</kbd>
      </form>

      {/* Right Topbar Icons & Profile */}
      <div className="flex items-center gap-3.5">
        <button
          className="relative p-2.5 text-[#65766d] hover:text-[#20322d] hover:bg-[#f1f5f1] rounded-xl transition-colors cursor-pointer"
          type="button"
          aria-label="Notifications"
          title="Notifications are coming soon"
          onClick={() => toast.info('Notifications are coming soon.')}
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#e35d55] ring-2 ring-white" />
        </button>

        <div className="relative pl-3.5 border-l border-[#edf0ec]">
          <button
            className={`flex items-center gap-3 p-1.5 pr-3 rounded-xl border text-left transition-all cursor-pointer ${
              profileOpen ? 'border-[#cbded2] bg-[#f6f9f6]' : 'border-transparent hover:border-[#e6ebe5] hover:bg-[#f4f7f3]'
            }`}
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen(value => !value)}
          >
            <span className="w-9 h-9 rounded-full bg-[#dcebe0] text-[#32634d] font-extrabold text-sm flex items-center justify-center shrink-0 border border-[#c2dcd0]">
              {staff.user.email.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:flex flex-col min-w-0">
              <b className="text-sm font-bold text-[#35483e] truncate max-w-[155px]">{staff.user.email}</b>
              <span className="text-xs font-semibold text-[#829087] uppercase tracking-wider leading-normal">
                {staff.roles[0]?.replaceAll('_', ' ') || 'Staff'}
              </span>
            </span>
            <ChevronDown size={16} className="text-[#87948c] shrink-0 hidden sm:block" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-76 bg-white border border-[#e1e8e2] rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="flex items-center gap-3.5 p-3 bg-[#f5f8f5] rounded-lg">
                <span className="w-10 h-10 rounded-full bg-[#e2f0e6] text-[#286447] font-extrabold text-base flex items-center justify-center shrink-0 border border-[#c2dcd0]">
                  {staff.user.email.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex flex-col min-w-0">
                  <b className="text-sm font-bold text-[#2f4339] truncate">{staff.user.email}</b>
                  <span className="text-xs font-semibold text-[#819087] uppercase tracking-wider leading-normal mt-0.5">
                    {staff.roles[0]?.replaceAll('_', ' ') || 'Staff account'}
                  </span>
                </span>
              </div>
              <div className="my-2 border-t border-[#edf0ec]" />
              <AsyncButton
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-semibold text-[#485a50] hover:bg-[#fbefed] hover:text-[#a54d47] transition-colors text-left cursor-pointer"
                role="menuitem"
                onClick={logout}
              >
                <span className="w-8 h-8 rounded-md bg-[#f0f4f0] flex items-center justify-center text-[#62796c] shrink-0">
                  <LogOut size={16} />
                </span>
                <span>Sign out</span>
              </AsyncButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
