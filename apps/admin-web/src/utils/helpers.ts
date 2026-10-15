export const isoToday = (timeZone = 'UTC') =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export const plusDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const readId = (value: any) => value?._id || value?.id;

export const humanStatus = (status = '') => status.toLowerCase().replaceAll('_', ' ');

export const resolveImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/api\/v1\/?$/, '');
    return `${apiBase}${url}`;
  }
  return url;
};
