import { BedDouble, Pencil } from 'lucide-react';
import { RoomType } from '../../../api';
import { DataTable, Column, Status, Button } from '../../../components/ui';
import { readId } from '../../../utils/helpers';

interface RoomTypesViewProps {
  rooms: RoomType[];
  loading: boolean;
  selectedHotelName?: string;
  onAddRoomType?: () => void;
  onEditRoomType?: (room: RoomType) => void;
}

export function RoomTypesView({ rooms, loading, selectedHotelName, onAddRoomType, onEditRoomType }: RoomTypesViewProps) {
  const columns: Column<RoomType>[] = [
    {
      key: 'name',
      header: 'Room Type',
      cell: (room) => (
        <span className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-sky-100/70 text-sky-700 flex items-center justify-center shrink-0">
            <BedDouble size={16} />
          </span>
          <span className="flex flex-col">
            <b className="font-semibold text-slate-900">{room.name}</b>
            <small className="text-[11px] text-slate-400 font-mono">{room.code}</small>
          </span>
        </span>
      ),
    },
    {
      key: 'guests',
      header: 'Capacity',
      cell: (room) => (
        <span className="font-medium text-slate-700">
          {room.maxAdults} adults{room.maxChildren ? ` · ${room.maxChildren} children` : ''}
        </span>
      ),
    },
    {
      key: 'totalRooms',
      header: 'Sellable Rooms',
      cell: (room) => <span className="font-semibold text-slate-800">{room.totalRooms}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (room) => <Status status={room.status} />,
    },
    ...(onEditRoomType
      ? [
          {
            key: 'actions',
            header: 'Actions',
            className: 'w-24 text-right',
            cell: (room: RoomType) => (
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Pencil size={13} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRoomType(room);
                  }}
                >
                  Edit
                </Button>
              </div>
            ),
          } as Column<RoomType>,
        ]
      : []),
  ];

  return (
    <DataTable<RoomType>
      data={rooms}
      columns={columns}
      rowKey={(r) => readId(r)}
      loading={loading}
      emptyTitle="No room types configured"
      emptyCopy={`No room categories have been added for ${selectedHotelName || 'this property'} yet.`}
      emptyIcon={<BedDouble size={32} className="text-slate-400" />}
      emptyAction={
        onAddRoomType ? (
          <button
            type="button"
            onClick={onAddRoomType}
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Add room type
          </button>
        ) : undefined
      }
    />
  );
}
