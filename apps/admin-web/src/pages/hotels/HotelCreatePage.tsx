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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          eyebrow="PROPERTY SETUP"
          title="Add a hotel"
          description="Create a new property draft to configure capacity, rates, and policies."
        />
      </div>

      <HotelCreateForm onSuccess={handleCreated} onCancel={handleCancel} />
    </div>
  );
}
