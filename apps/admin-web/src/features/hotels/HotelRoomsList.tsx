import { BedDouble } from 'lucide-react';
import { RoomType } from '../../api';
import { EmptyState, Status } from '../../components/ui';
import { readId } from '../../utils/helpers';

/** Read-only list of a hotel's room types for the workspace Rooms tab. */
export function HotelRoomsList({ rooms }: { rooms: RoomType[] }) {
  if (rooms.length === 0) {
    return (
      <EmptyState
        compact
        icon={<BedDouble size={20} />}
        title="No rooms yet"
        copy="Add at least one room type. Rooms need a nightly rate and inventory before the hotel can be published."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {rooms.map((room) => (
        <div key={readId(room)} className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <BedDouble size={14} />
            </span>
            <div>
              <b className="font-semibold text-slate-800 block">{room.name}</b>
              <span className="text-[11px] text-slate-400">
                {room.code} · {room.totalRooms} rooms · up to {room.maxAdults} adults
              </span>
            </div>
          </div>
          <Status status={room.status} variant="dot" />
        </div>
      ))}
    </div>
  );
}
