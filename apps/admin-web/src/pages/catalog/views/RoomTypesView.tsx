import { BedDouble } from 'lucide-react';
import { RoomType } from '../../../api';
import { DataTable, Column, Status } from '../../../components/ui';
import { readId } from '../../../utils/helpers';

interface RoomTypesViewProps {
  rooms: RoomType[];
  loading: boolean;
  selectedHotelName?: string;
}

export function RoomTypesView({ rooms, loading, selectedHotelName }: RoomTypesViewProps) {
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
    />
  );
}
