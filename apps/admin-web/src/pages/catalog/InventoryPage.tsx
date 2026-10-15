import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Hotel, RoomType, InventoryDay, StaffMe } from '../../api';
import { PageHeading, MetricCard, Alert, Field, Input } from '../../components/ui';
import { readId, plusDays } from '../../utils/helpers';
import { useToast, useBusyGuard } from '../../ui-feedback';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';
import { getInventoryRange, initializeInventory } from '../../features/inventory/inventory.api';
import { InventoryCalendarView } from './views/InventoryCalendarView';
import { HotelRoomPicker } from './components/HotelRoomPicker';
import { InventoryAdjustModal } from './components/InventoryAdjustModal';

export function InventoryPage({ staff }: { staff: StaffMe }) {
  const toast = useToast();
  const { busy, run } = useBusyGuard();

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [from, setFrom] = useState('');
  const [selectedNightForAdjust, setSelectedNightForAdjust] = useState<InventoryDay | null>(null);

  const roomId = selectedRoom ? readId(selectedRoom) : '';

  // Initialize property-local date
  useEffect(() => {
    if (selectedHotel && !from) {
      try {
        const localDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: selectedHotel.timezone || 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());
        setFrom(localDate);
      } catch {
        setFrom(new Date().toISOString().slice(0, 10));
      }
    }
  }, [selectedHotel, from]);

  const {
    data: inventoryData,
    loading,
    error,
    refetch,
  } = useApiQuery<{ nights: InventoryDay[] }>(
    (signal) =>
      roomId && from
        ? getInventoryRange(roomId, from, plusDays(from, 14), signal)
        : Promise.resolve({ nights: [] }),
    [roomId, from],
    {
      tags: roomId ? [`inventory:${roomId}`] : [],
      enabled: Boolean(roomId && from),
    }
  );

  const days = inventoryData?.nights || [];
  const missing = useMemo(() => 14 - days.length, [days]);

  const inventorySummary = useMemo(
    () =>
      days.reduce(
        (sum, day) => ({
          available: sum.available + day.available,
          held: sum.held + day.held,
          confirmed: sum.confirmed + day.confirmed,
          blocked: sum.blocked + day.blocked,
        }),
        { available: 0, held: 0, confirmed: 0, blocked: 0 }
      ),
    [days]
  );

  const handleInitialize = () => {
    if (!roomId || !from) return;
    void run(async () => {
      try {
        const result = await initializeInventory(roomId, from, plusDays(from, 14));
        toast.success(`${result.createdNights} nights initialized for ${selectedRoom?.name}.`);
        invalidate(`inventory:${roomId}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not initialize dates');
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="PROPERTY AVAILABILITY"
        title="Availability"
        description="Review sellable rooms by property-local stay date."
      />

      {Boolean(error) && (
        <Alert tone="error">
          {error instanceof Error ? error.message : String(error || 'Could not load availability')}
        </Alert>
      )}

      <HotelRoomPicker
        needsRoom={true}
        loading={loading}
        onRefresh={refetch}
        onSelectionChange={({ hotel, room }) => {
          setSelectedHotel(hotel);
          setSelectedRoom(room);
        }}
        extraFilters={
          <Field label="First stay date" className="sm:w-44">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
        }
      />

      {selectedRoom && days.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <MetricCard
            label="Available room nights"
            value={inventorySummary.available}
            detail="Next 14 nights"
            tone="green"
            icon={<CheckCircle2 size={18} />}
          />
          <MetricCard
            label="Reserved / Confirmed"
            value={inventorySummary.confirmed}
            detail="Booked room nights"
            tone="teal"
            icon={<CalendarDays size={18} />}
          />
          <MetricCard
            label="Maintenance blocks"
            value={inventorySummary.blocked}
            detail="Unavailable nights"
            tone={inventorySummary.blocked > 0 ? 'amber' : 'slate'}
            icon={<ShieldAlert size={18} />}
          />
        </div>
      )}

      {selectedRoom && (
        <InventoryCalendarView
          selectedRoomName={selectedRoom.name}
          selectedHotelTimezone={selectedHotel?.timezone}
          from={from}
          days={days}
          missing={missing}
          staff={staff}
          busy={busy}
          onInitialize={handleInitialize}
          onAdjustDate={(day) => setSelectedNightForAdjust(day)}
        />
      )}

      {selectedNightForAdjust && selectedRoom && (
        <InventoryAdjustModal
          day={selectedNightForAdjust}
          roomId={roomId}
          roomName={selectedRoom.name}
          onClose={() => setSelectedNightForAdjust(null)}
          onSuccess={() => {
            setSelectedNightForAdjust(null);
            invalidate(`inventory:${roomId}`);
          }}
        />
      )}
    </div>
  );
}
