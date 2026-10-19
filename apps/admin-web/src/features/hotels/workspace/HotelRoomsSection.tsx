import { Plus, BedDouble, Users, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Hotel, RoomType } from '../../../api';
import { Button, Status } from '../../../components/ui';
import { readId } from '../../../utils/helpers';
import { Can } from '../../auth/Can';

interface HotelRoomsSectionProps {
  hotel: Hotel;
  rooms: RoomType[];
  onOpenCreateModal: () => void;
}

export function HotelRoomsSection({
  hotel: _hotel,
  rooms,
  onOpenCreateModal,
}: HotelRoomsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Room Categories</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure accommodation tiers, inventory quotas, and base room pricing.
          </p>
        </div>

        <Can permission="rooms.create">
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={onOpenCreateModal}
          >
            Add Room Category
          </Button>
        </Can>
      </div>

      {/* When 0 rooms: Empty State */}
      {rooms.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/40 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#164e3f] shadow-2xs mb-3">
            <BedDouble size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No room categories yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Add at least one active room category to define inventory, capacity, and rate plans for guest bookings.
          </p>
          <div className="mt-4">
            <Can permission="rooms.create">
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={onOpenCreateModal}
              >
                Add First Room Category
              </Button>
            </Can>
          </div>
        </div>
      ) : (
        /* Room Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room) => {
            const roomId = readId(room);
            return (
              <div
                key={roomId}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-[#164e3f]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50/80 border border-emerald-100/80 text-[#164e3f] flex items-center justify-center shrink-0">
                      <BedDouble size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                        {room.name}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        {room.code} · {room.totalRooms} total rooms
                      </span>
                    </div>
                  </div>
                  <Status status={room.status} variant="pill" />
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Users size={13} className="text-slate-400" />
                      {room.maxAdults} adults{room.maxChildren ? `, ${room.maxChildren} children` : ''}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700">
                      {room.totalRooms} rooms capacity
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/room-types/${roomId}/edit`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#164e3f] hover:underline cursor-pointer"
                  >
                    <span>Manage</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
