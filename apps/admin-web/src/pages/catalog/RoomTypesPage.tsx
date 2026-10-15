import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BedDouble, Building2, Plus, Sparkles } from 'lucide-react';
import { Hotel, RoomType, StaffMe } from '../../api';
import { PageHeading, Button, MetricCard, Alert } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { useApiQuery } from '../../hooks/useApiQuery';
import { listRoomTypes } from '../../features/rooms/rooms.api';
import { RoomTypesView } from './views/RoomTypesView';
import { HotelRoomPicker } from './components/HotelRoomPicker';
import { Can } from '../../features/auth/Can';

export function RoomTypesPage({ staff: _staff }: { staff: StaffMe }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const initialHotelParam = searchParams.get('hotel') || '';
  const hotelId = selectedHotel ? readId(selectedHotel) : initialHotelParam;

  const {
    data: rooms = [],
    loading,
    error,
    refetch,
  } = useApiQuery<RoomType[]>(
    (signal) => (hotelId ? listRoomTypes(hotelId, signal) : Promise.resolve([])),
    [hotelId],
    { tags: hotelId ? [`room-types:${hotelId}`] : [], enabled: Boolean(hotelId) }
  );

  const activeSellableRooms = useMemo(
    () => rooms.reduce((sum, room) => sum + room.totalRooms, 0),
    [rooms]
  );

  const handleAddRoom = () => {
    navigate(hotelId ? `/admin/room-types/new?hotel=${hotelId}` : '/admin/room-types/new');
  };

  const handleEditRoom = (room: RoomType) => {
    navigate(`/admin/room-types/${readId(room)}/edit?hotel=${hotelId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          eyebrow="ROOM CATALOG"
          title="Room types"
          description="Manage the room categories available at each property."
        />
        {hotelId && (
          <Can permission="room_types.create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleAddRoom}
            >
              Add room type
            </Button>
          </Can>
        )}
      </div>

      {Boolean(error) && (
        <Alert tone="error">
          {error instanceof Error ? error.message : String(error || 'Could not load room types')}
        </Alert>
      )}

      <HotelRoomPicker
        needsRoom={false}
        loading={loading}
        onRefresh={refetch}
        onSelectionChange={({ hotel }) => setSelectedHotel(hotel)}
      />

      {selectedHotel && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Room categories"
            value={rooms.length}
            detail={selectedHotel.name}
            tone="green"
            icon={<BedDouble size={18} />}
          />
          <MetricCard
            label="Total sellable inventory"
            value={`${activeSellableRooms} rooms`}
            detail="Across all room types"
            tone="teal"
            icon={<Sparkles size={18} />}
          />
          <MetricCard
            label="Property status"
            value={selectedHotel.status}
            detail={selectedHotel.address?.city || 'Unassigned'}
            tone="sand"
            icon={<Building2 size={18} />}
          />
        </div>
      )}

      <RoomTypesView
        rooms={rooms}
        loading={loading}
        selectedHotelName={selectedHotel?.name}
        onAddRoomType={handleAddRoom}
        onEditRoomType={handleEditRoom}
      />
    </div>
  );
}
