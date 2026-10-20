import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Hotel, StaffMe } from '../../api';
import { PageHeading, Button, Alert, Loader, ConfirmDialog } from '../../components/ui';
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

  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const handleBack = () => {
    if (dirty) setConfirmLeave(true);
    else navigate('/admin/hotels');
  };

  // Only the first load shows the loader; refetches after a save keep the workspace (and its tab) mounted.
  if (loading && !hotel) {
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
        onDirtyChange={setDirty}
        onSaved={() => {
          invalidate('hotels');
          void refetch();
        }}
        staff={staff}
      />
      <ConfirmDialog
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => navigate('/admin/hotels')}
        title="Leave without saving?"
        message="You have unsaved changes on this hotel. They will be lost if you leave now."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        variant="danger"
        icon="warning"
      />
    </div>
  );
}
