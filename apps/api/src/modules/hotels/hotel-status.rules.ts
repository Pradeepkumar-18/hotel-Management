import { HotelStatus } from './schemas/hotel.schema';

export const BULK_TRANSITIONS: Record<HotelStatus, HotelStatus[]> = {
  [HotelStatus.DRAFT]: [HotelStatus.ARCHIVED], // DRAFT → PUBLISHED only via POST /:id/publish
  [HotelStatus.PUBLISHED]: [HotelStatus.SUSPENDED, HotelStatus.ARCHIVED],
  [HotelStatus.SUSPENDED]: [HotelStatus.PUBLISHED, HotelStatus.ARCHIVED],
  [HotelStatus.ARCHIVED]: [], // terminal state
};

export const PERMISSION_FOR_STATUS: Record<HotelStatus, string> = {
  [HotelStatus.PUBLISHED]: 'hotels.publish',
  [HotelStatus.SUSPENDED]: 'hotels.edit',
  [HotelStatus.ARCHIVED]: 'hotels.archive',
  [HotelStatus.DRAFT]: 'hotels.edit',
};
