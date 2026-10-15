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
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gradient-to-b from-brand-dark via-brand-deep to-brand-darkest text-slate-50 border-r border-white/10 transition-all duration-200 ease-in-out shadow-xl ${
          sidebarCollapsed ? 'w-20 p-3' : 'w-68 p-4'
        } ${mobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-white/10 shrink-0">
          <Link className="flex items-center gap-3 font-bold text-white tracking-tight hover:opacity-95 transition-opacity" to="/admin/dashboard" title="Staywise dashboard">
            <span className="w-10 h-10 rounded-xl bg-brand-lime text-brand-dark flex items-center justify-center font-extrabold shrink-0 shadow-md">
              <Compass size={22} />
            </span>
            {!sidebarCollapsed && (
              <span className="flex flex-col">
                <span className="text-base font-extrabold text-white leading-tight tracking-tight">staywise</span>
                <span className="text-[10px] font-bold tracking-wider text-brand-sage uppercase mt-0.5">HOTEL OPERATIONS</span>
              </span>
            )}
          </Link>
          <button
            className="p-2 rounded-lg text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 py-1 pr-0.5" aria-label="Admin navigation">
          {staff.permissions.includes(dashboardNav.permission) && (
            <NavItem
              to={dashboardNav.to}
              label={dashboardNav.label}
              collapsed={sidebarCollapsed}
              icon={<dashboardNav.icon size={19} strokeWidth={2} />}
              onClick={() => setMobileNav(false)}
            />
          )}
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => staff.permissions.includes(item.permission));
            const isCollapsed = Boolean(collapsedGroups[group.label]);
            const GroupIcon = group.icon;

            return visibleItems.length ? (
              <section className="flex flex-col gap-0.5 mt-1" key={group.label}>
                {!sidebarCollapsed ? (
                  <button
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-sage hover:text-white transition-colors rounded-md cursor-pointer"
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((current) => ({
                        ...current,
                        [group.label]: !current[group.label],
                      }))
                    }
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.label}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <GroupIcon size={15} strokeWidth={2} className="text-brand-sage" />
                      <span>{group.label}</span>
                    </span>
                    <ChevronDown className={`transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`} size={15} />
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
                      icon={<Icon size={19} strokeWidth={2} />}
                      onClick={() => setMobileNav(false)}
                    />
                  ))}
              </section>
            ) : null;
          })}
        </nav>

        {/* Footer Support & Settings */}
        <div className="pt-3 border-t border-white/10 flex flex-col gap-2 shrink-0">
          {!sidebarCollapsed && (
            <div className="p-3.5 rounded-xl bg-white/8 border border-white/10 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-brand-lime/15 text-brand-lime flex items-center justify-center shrink-0">
                <CircleHelp size={18} />
              </span>
              <span className="text-xs leading-tight">
                <b className="block font-bold text-slate-100 text-[13px]">Need a hand?</b>
                <span className="text-brand-sage text-xs leading-normal mt-0.5 block">Ask your Staywise admin</span>
              </span>
            </div>
          )}
          <button
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-60 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            type="button"
            disabled
            title="Settings are coming soon"
          >
            <Settings size={18} className="text-brand-sage" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left font-semibold">Settings</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-semibold">Upcoming</span>
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
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all m-0 ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-gradient-to-r from-brand-lime/20 to-brand-lime/10 text-white font-bold border border-brand-lime/35 shadow-xs'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
      to={to}
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
    >
      <span className={`shrink-0 ${active ? 'text-brand-lime' : 'text-brand-sage'}`}>{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && (
        <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime shrink-0 shadow-xs" />
      )}
    </Link>
  );
}
