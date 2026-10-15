import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Hotel, StaffMe } from '../../api';
import { PageHeading, Alert } from '../../components/ui';
import { RoomTypeForm } from '../../features/rooms/RoomTypeForm';
import { HotelRoomPicker } from './components/HotelRoomPicker';
import { readId } from '../../utils/helpers';
import { invalidate } from '../../hooks/useApiQuery';

export function RoomTypeCreatePage({ staff: _staff }: { staff: StaffMe }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const initialHotelId = searchParams.get('hotel') || '';
  const effectiveHotelId = selectedHotel ? readId(selectedHotel) : initialHotelId;

  const handleBack = () => {
    navigate(effectiveHotelId ? `/admin/room-types?hotel=${effectiveHotelId}` : '/admin/room-types');
  };

  const handleSuccess = () => {
    if (effectiveHotelId) {
      invalidate(`room-types:${effectiveHotelId}`);
    }
    handleBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          eyebrow="ROOM CATALOG"
          title="Add room type"
          description="Define a new sellable room category and guest occupancy terms."
        />
      </div>

      <HotelRoomPicker
        needsRoom={false}
        onSelectionChange={({ hotel }) => setSelectedHotel(hotel)}
      />

      {effectiveHotelId ? (
        <RoomTypeForm
          hotelId={effectiveHotelId}
          hotelName={selectedHotel?.name}
          onSuccess={handleSuccess}
          onCancel={handleBack}
        />
      ) : (
        <Alert tone="info">
          Please select a property from the picker above to proceed with creating a room category.
        </Alert>
      )}
    </div>
  );
}
