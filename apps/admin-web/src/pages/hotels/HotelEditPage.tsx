import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Hotel, StaffMe } from '../../api';
import { PageHeading, Button, Alert, Loader } from '../../components/ui';
import { HotelWorkspace } from '../../features/hotels/HotelWorkspace';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';
import { getHotel } from '../../features/hotels/hotels.api';

export function HotelEditPage({ staff }: { staff: StaffMe }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: hotel,
    loading,
    error,
    refetch,
  } = useApiQuery<Hotel>(
    (signal) => (id ? getHotel(id, signal) : Promise.reject(new Error('Missing hotel ID'))),
    [id],
    { enabled: Boolean(id) }
  );

  const handleBack = () => {
    navigate('/admin/hotels');
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={handleBack}>
          Back to hotels
        </Button>
        <Alert tone="error">
          {error instanceof Error ? error.message : String(error || 'Could not load hotel information.')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="EDIT HOTEL"
        title={hotel.name}
        description={[hotel.address?.city, hotel.timezone].filter(Boolean).join(' · ')}
        action={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={handleBack}>
            Back to hotels
          </Button>
        }
      />

      <HotelWorkspace
        hotel={hotel}
        variant="inline"
        onClose={handleBack}
        onSaved={() => {
          invalidate('hotels');
          void refetch();
        }}
        staff={staff}
      />
    </div>
  );
}
