import { request, isApiError } from '../../api';

export type BaseRate = {
  _id?: string;
  id?: string;
  roomTypeId: string;
  amountMinorUnits: number;
  currency: string;
  version: number;
  updatedAt?: string;
  createdAt?: string;
};

export async function getBaseRate(roomTypeId: string, signal?: AbortSignal): Promise<BaseRate | null> {
  try {
    return await request<BaseRate>(`/admin/room-types/${roomTypeId}/base-rate`, { signal });
  } catch (e) {
    if (isApiError(e, 404)) return null; // no rate yet = "Unconfigured", not an error
    throw e;
  }
}

export function setBaseRate(
  roomTypeId: string,
  body: {
    amountMinorUnits: number;
    currency: string;
    version?: number;
    reason: string;
  }
) {
  return request<BaseRate>(`/admin/room-types/${roomTypeId}/base-rate`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
