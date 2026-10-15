export type HotelStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';

export const STATUS_LABEL: Record<HotelStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  SUSPENDED: 'Suspended',
  ARCHIVED: 'Archived',
};

export const STATUS_BADGE_STYLE: Record<HotelStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-orange-50 text-orange-700 border-orange-200',
  ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-300',
};
