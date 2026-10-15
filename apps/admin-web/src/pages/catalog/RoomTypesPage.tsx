import { useState, useMemo } from 'react';
import { BedDouble, Building2, Plus, Sparkles } from 'lucide-react';
import { Hotel, RoomType, StaffMe } from '../../api';
import { PageHeading, Button, MetricCard, Alert } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';
import { listRoomTypes } from '../../features/rooms/rooms.api';
import { RoomTypesView } from './views/RoomTypesView';
import { HotelRoomPicker } from './components/HotelRoomPicker';
import { RoomCreateModal } from '../../features/rooms/RoomCreateModal';
import { Can } from '../../features/auth/Can';

export function RoomTypesPage({ staff: _staff }: { staff: StaffMe }) {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const hotelId = selectedHotel ? readId(selectedHotel) : '';

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
              onClick={() => setIsCreateOpen(true)}
            >
              Add room type
            </Button>
          </Can>
        )}
      </div>

      {Boolean(error) && <Alert tone="error">{error instanceof Error ? error.message : String(error || 'Could not load room types')}</Alert>}

      <HotelRoomPicker
        needsRoom={false}
        loading={loading}
        onRefresh={refetch}
        onSelectionChange={({ hotel }) => setSelectedHotel(hotel)}
      />

      {selectedHotel && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
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
        onAddRoomType={() => setIsCreateOpen(true)}
      />

      {isCreateOpen && selectedHotel && (
        <RoomCreateModal
          hotelId={hotelId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            invalidate(`room-types:${hotelId}`);
          }}
        />
      )}
    </div>
  );
}
