import { request, RoomType } from '../../api';

export function listRoomTypes(hotelId: string, signal?: AbortSignal) {
  return request<RoomType[]>(`/admin/hotels/${hotelId}/room-types`, { signal });
}

export function createRoomType(hotelId: string, body: Partial<RoomType>) {
  return request<RoomType>(`/admin/hotels/${hotelId}/room-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getRoomType(roomTypeId: string, signal?: AbortSignal) {
  return request<RoomType>(`/admin/room-types/${roomTypeId}`, { signal });
}
