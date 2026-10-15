const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
let csrfToken = '';

export function setCsrfToken(value: string) { csrfToken = value; }

function readCsrfCookie() {
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('staywise_staff_csrf='));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

import { ApiError, toApiError, isApiError, PublishProblem } from './api/errors';
export { ApiError, toApiError, isApiError };
export type { PublishProblem };

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
  if (response.status === 204) {
    return undefined as T;
  }
  if (!response.ok) {
    const err = await toApiError(response);
    const sessionProblem =
      (err.status === 401 && path !== '/auth/staff/login') ||
      (err.status === 403 && err.code === 'CSRF_REJECTED');
    if (sessionProblem && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(API_ACCESS_EVENT, { detail: { status: 401, code: err.code } }));
    }
    throw err;
  }
  return response.json() as Promise<T>;
}

export type StaffMe = { user: { id: string; email: string }; roles: string[]; permissions: string[]; hotelIds: string[] };

export type HotelMediaItem = { url: string; isPrimary?: boolean; caption?: string; displayOrder?: number };

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
  media?: HotelMediaItem[];
  contact?: { email?: string; phone?: string };
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

export async function updateHotelMedia(id: string, version: number, media: HotelMediaItem[]): Promise<Hotel> {
  return request<Hotel>(`/admin/hotels/${id}/media`, {
    method: 'POST',
    body: JSON.stringify({ version, media }),
  });
}

export async function bulkUpdateHotelStatus(
  hotelIds: string[],
  status: string,
  reason?: string
): Promise<{ modifiedCount: number; status: string; updated?: string[]; skipped?: { hotelId: string; code?: string; message: string }[] }> {
  return request<{ modifiedCount: number; status: string; updated?: string[]; skipped?: { hotelId: string; code?: string; message: string }[] }>(
    '/admin/hotels/bulk-status',
    {
      method: 'PATCH',
      body: JSON.stringify({ hotelIds, status, reason }),
    }
  );
}

export type HotelMetrics = {
  total: number;
  published: number;
  draft: number;
  suspended: number;
  archived: number;
};

export async function fetchHotelMetrics(): Promise<HotelMetrics> {
  return request<HotelMetrics>('/admin/hotels/metrics');
}


