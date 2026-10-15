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
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white text-slate-800 border-r border-slate-200/90 transition-all duration-200 ease-in-out shadow-xs ${
          sidebarCollapsed ? 'w-20 p-3' : 'w-68 p-4'
        } ${mobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between pb-3.5 mb-2.5 border-b border-slate-100 shrink-0">
          <Link
            className="flex items-center gap-3 font-bold text-slate-900 tracking-tight hover:opacity-90 transition-opacity"
            to="/admin/dashboard"
            title="Staywise dashboard"
          >
            <span className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-extrabold shrink-0 shadow-2xs">
              <Compass size={22} />
            </span>
            {!sidebarCollapsed && (
              <span className="flex flex-col">
                <span className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">staywise</span>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">HOTEL OPERATIONS</span>
              </span>
            )}
          </Link>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
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
              <section className="flex flex-col gap-1 mt-2.5" key={group.label}>
                {!sidebarCollapsed ? (
                  <button
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors rounded-md cursor-pointer"
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
                    <span className="flex items-center gap-2">
                      <GroupIcon size={15} strokeWidth={2} className="text-slate-400" />
                      <span>{group.label}</span>
                    </span>
                    <ChevronDown className={`transition-transform duration-150 text-slate-400 ${isCollapsed ? '-rotate-90' : ''}`} size={15} />
                  </button>
                ) : (
                  <div className="h-px bg-slate-200/70 my-1.5" title={group.label} />
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
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 shrink-0">
          {!sidebarCollapsed && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-sky-100/70 text-brand-primary flex items-center justify-center shrink-0">
                <CircleHelp size={18} />
              </span>
              <span className="text-xs leading-tight">
                <b className="block font-bold text-slate-800 text-[13px]">Need a hand?</b>
                <span className="text-slate-500 text-xs leading-normal mt-0.5 block">Ask your Staywise admin</span>
              </span>
            </div>
          )}
          <button
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-60 cursor-pointer ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            type="button"
            disabled
            title="Settings are coming soon"
          >
            <Settings size={18} className="text-slate-400" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left font-medium">Settings</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-200/60 text-slate-500 text-[11px] font-medium">Soon</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-xs md:hidden cursor-pointer"
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
      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all m-0 select-none ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-brand-pale text-brand-primary font-semibold border border-brand-border/60 shadow-2xs'
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
      }`}
      to={to}
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
    >
      <span className={`shrink-0 transition-colors ${active ? 'text-brand-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 shadow-2xs" />
      )}
    </Link>
  );
}
