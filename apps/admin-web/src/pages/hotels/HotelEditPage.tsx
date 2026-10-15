import { useNavigate, useParams } from 'react-router-dom';
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
        <Button variant="outline" size="sm" onClick={handleBack}>
          Cancel
        </Button>
        <Alert tone="error">
          {error instanceof Error ? error.message : String(error || 'Could not load hotel information.')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          eyebrow="PROPERTY WORKSPACE"
          title={`Edit Property: ${hotel.name}`}
          description={`${hotel.address?.city || ''} · ${hotel.timezone} · Configure details, photo gallery, room categories, and policies.`}
        />
      </div>

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
