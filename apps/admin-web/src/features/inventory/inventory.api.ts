import { request, InventoryDay } from '../../api';

export type NightInventory = {
  stayDate: string;
  total: number;
  blocked: number;
  held: number;
  confirmed: number;
  available: number;
  version: number;
};

export function adjustNight(
  roomTypeId: string,
  stayDate: string,
  action: 'block' | 'unblock',
  body: { version: number; quantity: number; reason: string }
) {
  return request<NightInventory>(`/admin/room-types/${roomTypeId}/inventory/${stayDate}/${action}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getInventoryRange(roomTypeId: string, from: string, to: string, signal?: AbortSignal) {
  return request<{ nights: InventoryDay[] }>(
    `/admin/room-types/${roomTypeId}/inventory?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { signal }
  );
}

export function initializeInventory(roomTypeId: string, from: string, to: string) {
  return request<{ createdNights: number }>(`/admin/room-types/${roomTypeId}/inventory/initialize`, {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  });
}
