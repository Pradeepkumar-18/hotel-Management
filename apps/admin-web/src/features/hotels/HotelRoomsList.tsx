import { BedDouble, Camera, Image as ImageIcon } from 'lucide-react';
import { RoomType } from '../../api';
import { Button, EmptyState, Status } from '../../components/ui';
import { readId, resolveImageUrl } from '../../utils/helpers';

interface HotelRoomsListProps {
  rooms: RoomType[];
  onManagePhotos?: (room: RoomType) => void;
  readOnly?: boolean;
}

/** List of a hotel's room types with photo management for the workspace Rooms tab. */
export function HotelRoomsList({ rooms, onManagePhotos, readOnly = false }: HotelRoomsListProps) {
  if (rooms.length === 0) {
    return (
      <EmptyState
        compact
        icon={<BedDouble size={20} />}
        title="No rooms yet"
        copy="Add at least one room type. Rooms need photos, a nightly rate, and inventory before the hotel can be published."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {rooms.map((room) => {
        const media = room.media || [];
        const primary = media.find((m) => m.isPrimary) || media[0];

        return (
          <div
            key={readId(room)}
            className="p-3.5 border border-slate-200/90 rounded-xl bg-white flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {primary ? (
                <img
                  src={resolveImageUrl(primary.url)}
                  alt={room.name}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-100 shrink-0"
                />
              ) : (
                <span className="w-14 h-14 rounded-lg bg-slate-100 text-slate-500 flex flex-col items-center justify-center shrink-0 text-[10px] gap-0.5">
                  <BedDouble size={18} />
                  <span>No photo</span>
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <b className="font-semibold text-slate-900 text-sm truncate block">{room.name}</b>
                  <Status status={room.status} variant="dot" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-slate-600 font-medium">{room.code}</span> · {room.totalRooms} rooms · up to {room.maxAdults} adults {room.maxChildren > 0 ? `+ ${room.maxChildren} children` : ''}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    <Camera size={11} />
                    {media.length} {media.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>
            </div>

            {onManagePhotos && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {media.length > 0 ? 'Room gallery configured' : 'Add room photos for guests'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<ImageIcon size={12} />}
                  onClick={() => onManagePhotos(room)}
                  disabled={readOnly}
                >
                  {media.length > 0 ? 'Manage photos' : 'Add photos'}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
