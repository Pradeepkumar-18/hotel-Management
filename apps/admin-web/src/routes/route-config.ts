import { BedDouble, Building2, CalendarDays, DollarSign, LayoutDashboard } from 'lucide-react';
import { StaffMe } from '../api';

export const dashboardNav = {
  to: '/admin/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  permission: 'hotels.view',
};

export const navGroups = [
  {
    label: 'Property setup',
    icon: Building2,
    items: [
      { to: '/admin/hotels', label: 'Hotels', icon: Building2, permission: 'hotels.view' },
      { to: '/admin/room-types', label: 'Room types', icon: BedDouble, permission: 'room_types.view' },
    ],
  },
  {
    label: 'Operations',
    icon: CalendarDays,
    items: [
      { to: '/admin/inventory', label: 'Availability', icon: CalendarDays, permission: 'inventory.view' },
      { to: '/admin/rates', label: 'Base rates', icon: DollarSign, permission: 'rates.view' },
    ],
  },
];

export const routePermissions: Record<string, string> = {
  '/admin/dashboard': 'hotels.view',
  '/admin/hotels': 'hotels.view',
  '/admin/room-types': 'room_types.view',
  '/admin/inventory': 'inventory.view',
  '/admin/rates': 'rates.view',
};

export function homePath(staff: StaffMe): string {
  return (
    [dashboardNav, ...navGroups.flatMap(group => group.items)].find(item => staff.permissions.includes(item.permission))?.to ||
    '/admin/unauthorized'
  );
}
