import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Compass, Settings } from 'lucide-react';
import { StaffMe } from '../api';
import { dashboardNav, navGroups } from '../routes/route-config';

interface SidebarProps {
  staff: StaffMe;
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  collapsedGroups: Record<string, boolean>;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function Sidebar({
  staff,
  mobileNav,
  setMobileNav,
  sidebarCollapsed,
  setSidebarCollapsed,
  collapsedGroups,
  setCollapsedGroups,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gradient-to-b from-[#173f36] via-[#12362f] to-[#102f2a] text-[#f4faf6] border-r border-white/10 transition-all duration-200 ease-in-out shadow-xl ${
          sidebarCollapsed ? 'w-20 p-3' : 'w-68 p-4.5'
        } ${mobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/10 shrink-0">
          <Link className="flex items-center gap-3.5 font-bold text-white tracking-tight hover:opacity-95 transition-opacity" to="/admin/dashboard" title="Staywise dashboard">
            <span className="w-10 h-10 rounded-xl bg-[#d6ef9e] text-[#173f36] flex items-center justify-center font-extrabold shrink-0 shadow-md">
              <Compass size={22} />
            </span>
            {!sidebarCollapsed && (
              <span className="flex flex-col">
                <span className="text-lg font-extrabold text-white leading-tight tracking-tight">staywise</span>
                <span className="text-[9px] font-bold tracking-widest text-[#a8c3b5] uppercase mt-0.5">HOTEL OPERATIONS</span>
              </span>
            )}
          </Link>
          <button
            className="p-2 rounded-lg text-[#bad1c3] hover:text-white bg-white/5 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            type="button"
            onClick={() => setSidebarCollapsed(value => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
          </button>
        </div>

        {/* Navigation Items - Flex Gap instead of space-y margins */}
        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 py-1 pr-0.5" aria-label="Admin navigation">
          {staff.permissions.includes(dashboardNav.permission) && (
            <NavItem
              to={dashboardNav.to}
              label={dashboardNav.label}
              collapsed={sidebarCollapsed}
              icon={<dashboardNav.icon size={20} strokeWidth={2} />}
              onClick={() => setMobileNav(false)}
            />
          )}
          {navGroups.map(group => {
            const visibleItems = group.items.filter(item => staff.permissions.includes(item.permission));
            const isCollapsed = !!collapsedGroups[group.label];
            const GroupIcon = group.icon;

            return visibleItems.length ? (
              <section className="flex flex-col gap-1 mt-1" key={group.label}>
                {!sidebarCollapsed ? (
                  <button
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#92b3a3] hover:text-white transition-colors rounded-md cursor-pointer"
                    type="button"
                    onClick={() =>
                      setCollapsedGroups(current => ({
                        ...current,
                        [group.label]: !current[group.label],
                      }))
                    }
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.label}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <GroupIcon size={16} strokeWidth={2} className="text-[#92b3a3]" />
                      <span>{group.label}</span>
                    </span>
                    <ChevronDown className={`transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`} size={16} />
                  </button>
                ) : (
                  <div className="h-px bg-white/10 my-1.5" title={group.label} />
                )}
                {!isCollapsed &&
                  visibleItems.map(({ to, label, icon: Icon }) => (
                    <NavItem
                      key={to}
                      to={to}
                      label={label}
                      collapsed={sidebarCollapsed}
                      icon={<Icon size={20} strokeWidth={2} />}
                      onClick={() => setMobileNav(false)}
                    />
                  ))}
              </section>
            ) : null;
          })}
        </nav>

        {/* Footer Support & Settings */}
        <div className="pt-3.5 border-t border-white/10 flex flex-col gap-2.5 shrink-0">
          {!sidebarCollapsed && (
            <div className="p-3.5 rounded-xl bg-white/8 border border-white/10 flex items-center gap-3.5">
              <span className="w-9 h-9 rounded-lg bg-[#d6ef9e]/15 text-[#d6ef9e] flex items-center justify-center shrink-0">
                <CircleHelp size={19} />
              </span>
              <span className="text-xs leading-tight">
                <b className="block font-bold text-[#f1f7f3] text-sm">Need a hand?</b>
                <span className="text-[#a9c2b4] text-xs leading-normal mt-0.5 block">Ask your Staywise admin</span>
              </span>
            </div>
          )}
          <button
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[#aebfb4] hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-60 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            type="button"
            disabled
            title="Settings are coming soon"
          >
            <Settings size={18} className="text-[#9eb6a6]" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left font-semibold">Settings</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#a6b9ac] text-xs font-semibold">Upcoming</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs md:hidden cursor-pointer"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
    </>
  );
}

function NavItem({
  to,
  label,
  icon,
  onClick,
  collapsed = false,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all m-0 ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-gradient-to-r from-[#d6ef9e]/20 to-[#d6ef9e]/10 text-white font-extrabold border border-[#d6ef9e]/35 shadow-xs'
          : 'text-[#c1d5ca] hover:bg-white/10 hover:text-white'
      }`}
      to={to}
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
    >
      <span className={`shrink-0 ${active ? 'text-[#d6ef9e]' : 'text-[#a2c2b1]'}`}>{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && (
        <span className="ml-auto w-2 h-2 rounded-full bg-[#d6ef9e] shrink-0 shadow-[0_0_10px_rgba(214,239,158,0.85)]" />
      )}
    </Link>
  );
}
