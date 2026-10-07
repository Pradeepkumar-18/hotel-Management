const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
let csrfToken = '';

export function setCsrfToken(value: string) { csrfToken = value; }

function readCsrfCookie() {
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('staywise_staff_csrf='));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly payload?: any) { super(message); }
}

export const API_ACCESS_EVENT = 'staywise:api-access';

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> || {}) };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['x-csrf-token'] = csrfToken || readCsrfCookie();
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  const payload = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && path !== '/auth/staff/login' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(API_ACCESS_EVENT, { detail: { status: response.status } }));
    }
    throw new ApiError(payload?.message || payload?.error || `Request failed (${response.status})`, response.status, payload);
  }
  return payload as T;
}

export type StaffMe = { user: { id: string; email: string }; roles: string[]; permissions: string[]; hotelIds: string[] };

export type Hotel = {
  _id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  version: number;
  updatedAt?: string;
  createdAt?: string;
  primaryImage?: string;
  heroImage?: string;
  images?: string[];
  address: { city: string; countryCode: string; line1?: string; postalCode?: string };
  cancellationPolicy?: {
    effectiveFrom: string;
    freeCancellationHoursBeforeCheckIn: number;
    afterCutoff: { basis: string; amountMinorUnits?: number; currency?: string; percentageBps?: number };
    noShow: { basis: string; amountMinorUnits?: number; currency?: string; percentageBps?: number };
  };
};

export type RoomType = { _id: string; id?: string; hotelId: string; name: string; code: string; totalRooms: number; maxAdults: number; maxChildren: number; version: number; status: string };
export type InventoryDay = { stayDate: string; total: number; available: number; held: number; confirmed: number; blocked: number; version: number };
