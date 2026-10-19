import { useNavigate } from 'react-router-dom';
import { StaffMe, Hotel } from '../../api';
import { PageHeading } from '../../components/ui';
import { HotelCreateForm } from '../../features/hotels/HotelCreateForm';
import { readId } from '../../utils/helpers';
import { invalidate } from '../../hooks/useApiQuery';

export function HotelCreatePage({ staff: _staff }: { staff: StaffMe }) {
  const navigate = useNavigate();

  const handleCreated = (hotel: Hotel) => {
    invalidate('hotels');
    const hotelId = readId(hotel);
    navigate(`/admin/hotels/${hotelId}/edit`);
  };

  const handleCancel = () => {
    navigate('/admin/hotels');
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="NEW HOTEL"
        title="Add a hotel"
        description="Fill in the basics. Rooms, prices and the cancellation policy come next."
      />

      <HotelCreateForm onSuccess={handleCreated} onCancel={handleCancel} />
    </div>
  );
}
