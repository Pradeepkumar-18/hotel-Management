import { useState, type FormEvent } from 'react';
import { CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { Hotel, RoomType, StaffMe, isApiError } from '../../api';
import { PageHeading, MetricCard, Alert } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { useToast, useBusyGuard } from '../../ui-feedback';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { getBaseRate, setBaseRate, BaseRate } from '../../features/rates/rates.api';
import { listRoomTypes } from '../../features/rooms/rooms.api';
import { BaseRatesView } from './views/BaseRatesView';
import { HotelRoomPicker } from './components/HotelRoomPicker';

export function RatesPage({ staff }: { staff: StaffMe }) {
  const toast = useToast();
  const { busy, run } = useBusyGuard();
  const formErrors = useServerErrors();

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [hotelCurrency, setHotelCurrency] = useState<string | null>(null);

  const hotelId = selectedHotel ? readId(selectedHotel) : '';
  const roomId = selectedRoom ? readId(selectedRoom) : '';
  const canEditRates = staff.permissions.includes('rates.edit');

  // Load room types of the hotel for coverage calculation
  const { data: rooms = [] } = useApiQuery<RoomType[]>(
    (signal) => (hotelId ? listRoomTypes(hotelId, signal) : Promise.resolve([])),
    [hotelId],
    { tags: hotelId ? [`room-types:${hotelId}`] : [], enabled: Boolean(hotelId) }
  );

  // Load base rate for selected room
  const {
    data: rate = null,
    loading,
    error,
    refetch,
  } = useApiQuery<BaseRate | null>(
    (signal) => (roomId ? getBaseRate(roomId, signal) : Promise.resolve(null)),
    [roomId],
    {
      tags: roomId ? [`rate:${roomId}`] : [],
      enabled: Boolean(roomId),
    }
  );

  // Rate coverage calculation and hotel currency detection
  const { data: rateCoverage } = useApiQuery<{ configured: number; missing: number; currency: string | null } | null>(
    async (signal) => {
      if (!rooms.length) return null;
      let detectedCurrency: string | null = null;
      const results = await Promise.all(
        rooms.map(async (room) => {
          try {
            const res = await getBaseRate(readId(room), signal);
            if (res?.currency && !detectedCurrency) {
              detectedCurrency = res.currency;
            }
            return Boolean(res);
          } catch {
            return false;
          }
        })
      );
      if (detectedCurrency) setHotelCurrency(detectedCurrency);
      return {
        configured: results.filter(Boolean).length,
        missing: results.filter((val) => !val).length,
        currency: detectedCurrency,
      };
    },
    [rooms],
    { tags: rooms.map((r) => `rate:${readId(r)}`), enabled: rooms.length > 0 }
  );

  const handleSaveRate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomId) return;
    formErrors.clearErrors();

    const form = e.currentTarget;
    const f = new FormData(form);
    const amountVal = Number(f.get('amount'));
    const currencyVal = String(f.get('currency')).trim().toUpperCase();
    const reasonVal = String(f.get('reason')).trim();

    if (!Number.isInteger(amountVal) || amountVal < 0) {
      toast.error('Amount must be a non-negative whole integer (minor units)');
      return;
    }

    if (!currencyVal || currencyVal.length !== 3) {
      toast.error('Currency must be a 3-letter code');
      return;
    }

    if (!reasonVal || reasonVal.length < 3) {
      toast.error('Reason must be at least 3 characters');
      return;
    }

    const targetRoomId = roomId;
    const targetVersion = rate?.version;

    void run(async () => {
      try {
        const payload: {
          amountMinorUnits: number;
          currency: string;
          reason: string;
          version?: number;
        } = {
          amountMinorUnits: amountVal,
          currency: currencyVal,
          reason: reasonVal,
        };
        if (targetVersion !== undefined) {
          payload.version = targetVersion;
        }

        await setBaseRate(targetRoomId, payload);
        toast.success('Base rate saved. Tax is not included.');
        setHotelCurrency(currencyVal);
        invalidate(`rate:${targetRoomId}`);
      } catch (err) {
        handleFormError(err, formErrors, toast, {
          onConflict: () => {
            invalidate(`rate:${targetRoomId}`);
            toast.error('Someone else modified this rate. Latest data has been reloaded.');
          },
        });
      }
    });
  };

  const activeCurrency = hotelCurrency || rateCoverage?.currency || rate?.currency || 'INR';

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="ROOM PRICING"
        title="Base rates"
        description="Set the starting nightly price for each room type."
      />

      {Boolean(error) && !isApiError(error, 404) && (
        <Alert tone="error">
          {error instanceof Error ? error.message : String(error || 'Could not load base rate')}
        </Alert>
      )}

      {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}

      <HotelRoomPicker
        needsRoom={true}
        disabled={busy}
        loading={loading}
        onRefresh={refetch}
        onSelectionChange={({ hotel, room }) => {
          setSelectedHotel(hotel);
          setSelectedRoom(room);
        }}
      />

      {selectedRoom && rateCoverage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <MetricCard
            label="Room types priced"
            value={`${rateCoverage.configured} of ${rooms.length}`}
            detail={selectedHotel?.name || 'Selected property'}
            tone="green"
            icon={<CheckCircle2 size={18} />}
          />
          <MetricCard
            label="Unpriced room types"
            value={rateCoverage.missing}
            detail={rateCoverage.missing ? 'Requires base rate' : 'All room types priced'}
            tone={rateCoverage.missing ? 'amber' : 'green'}
            icon={<AlertCircle size={18} />}
          />
          <MetricCard
            label="Active currency"
            value={activeCurrency}
            detail="Property rate currency"
            tone="sand"
            icon={<DollarSign size={18} />}
          />
        </div>
      )}

      {selectedRoom && (
        <BaseRatesView
          selectedRoomName={selectedRoom.name}
          selectedHotelName={selectedHotel?.name}
          rate={rate}
          roomId={roomId}
          hotelCurrency={hotelCurrency || rateCoverage?.currency || rate?.currency || null}
          canEditRates={canEditRates}
          busy={busy}
          onSaveRate={handleSaveRate}
        />
      )}
    </div>
  );
}
