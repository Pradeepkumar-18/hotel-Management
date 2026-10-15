import { request, Hotel, HotelMetrics } from '../../api';
import { HotelStatus } from './hotel-status';

export type HotelList = {
  items: Hotel[];
  total: number;
};

export type ListHotelsParams = {
  search?: string;
  status?: string;
  city?: string;
  setupStatus?: string;
  limit?: number;
  offset?: number;
};

export function listHotels(params: ListHotelsParams = {}, signal?: AbortSignal) {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set('limit', String(params.limit));
  if (params.offset !== undefined) q.set('offset', String(params.offset));
  if (params.status && params.status !== 'ALL') q.set('status', params.status);
  if (params.city && params.city !== 'ALL') q.set('city', params.city);
  if (params.setupStatus && params.setupStatus !== 'ALL') q.set('setupStatus', params.setupStatus);
  if (params.search && params.search.trim()) q.set('search', params.search.trim());

  const qs = q.toString();
  return request<HotelList>(`/admin/hotels${qs ? `?${qs}` : ''}`, { signal });
}

export function fetchRecentHotels(limit = 8, signal?: AbortSignal) {
  return request<HotelList>(`/admin/hotels?limit=${limit}&offset=0`, { signal });
}

export function getHotelMetrics(signal?: AbortSignal) {
  return request<HotelMetrics>('/admin/hotels/metrics', { signal });
}

export function getHotel(id: string, signal?: AbortSignal) {
  return request<Hotel>(`/admin/hotels/${id}`, { signal });
}

export function createHotel(payload: any) {
  return request<Hotel>('/admin/hotels', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateHotel(id: string, payload: any) {
  return request<Hotel>(`/admin/hotels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function publishHotel(id: string, version: number) {
  return request<Hotel>(`/admin/hotels/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ version }),
  });
}

export function suspendHotel(id: string, version: number, reason?: string) {
  return request<Hotel>(`/admin/hotels/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ version, reason }),
  });
}

export function archiveHotel(id: string, version: number, reason?: string) {
  return request<Hotel>(`/admin/hotels/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ version, reason }),
  });
}

export function bulkUpdateStatus(body: { hotelIds: string[]; status: HotelStatus; reason: string }) {
  return request<{
    modifiedCount: number;
    status: HotelStatus;
    skipped?: { hotelId: string; message: string }[];
  }>('/admin/hotels/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
