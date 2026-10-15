import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RoomType, StaffMe } from '../../api';
import { PageHeading, Button, Alert, Loader } from '../../components/ui';
import { RoomTypeForm } from '../../features/rooms/RoomTypeForm';
import { getRoomType } from '../../features/rooms/rooms.api';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';

export function RoomTypeEditPage({ staff: _staff }: { staff: StaffMe }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    data: room,
    loading,
    error,
    refetch,
  } = useApiQuery<RoomType>(
    (signal) => (id ? getRoomType(id, signal) : Promise.reject(new Error('Missing room type ID'))),
    [id],
    { enabled: Boolean(id) }
  );

  const hotelId = room?.hotelId || searchParams.get('hotel') || '';

  const handleBack = () => {
    navigate(hotelId ? `/admin/room-types?hotel=${hotelId}` : '/admin/room-types');
  };

  const handleSuccess = () => {
    if (hotelId) {
      invalidate(`room-types:${hotelId}`);
    }
    void refetch();
    handleBack();
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={handleBack}>
          Back to room types
        </Button>
        <Alert tone="error">
          {error instanceof Error ? error.message : String(error || 'Could not load room type details.')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          eyebrow="ROOM CATALOG"
          title={`Edit Room Type: ${room.name}`}
          description={`Room code: ${room.code} · ${room.totalRooms} sellable rooms.`}
        />
      </div>

      <RoomTypeForm
        hotelId={room.hotelId}
        room={room}
        onSuccess={handleSuccess}
        onCancel={handleBack}
      />
    </div>
  );
}
