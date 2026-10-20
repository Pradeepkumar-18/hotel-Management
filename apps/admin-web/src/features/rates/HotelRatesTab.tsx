import { useState, useEffect, type FormEvent } from 'react';
import { AlertCircle, IndianRupee, Edit3, Plus, Lock } from 'lucide-react';
import { Hotel, RoomType } from '../../api';
import { Alert, Button, Field, Modal, MoneyInput, ReasonField, Select, Input, EmptyState } from '../../components/ui';
import { useToast, useBusyGuard } from '../../ui-feedback';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { getBaseRate, setBaseRate, BaseRate } from './rates.api';
import { DEFAULT_CURRENCY, formatMoney } from '../../utils/money';
import { readId } from '../../utils/helpers';

interface HotelRatesTabProps {
  hotel: Hotel;
  rooms: RoomType[];
  canEditRates?: boolean;
  readOnly?: boolean;
  onRatesUpdated?: () => void;
}

const RATE_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export function HotelRatesTab({
  hotel: _hotel,
  rooms,
  canEditRates = true,
  readOnly = false,
  onRatesUpdated,
}: HotelRatesTabProps) {
  const toast = useToast();
  const { busy, run } = useBusyGuard();
  const formErrors = useServerErrors();

  const [ratesMap, setRatesMap] = useState<Record<string, BaseRate | null>>({});
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [hotelCurrency, setHotelCurrency] = useState<string | null>(null);

  // Load rates for all rooms under this hotel
  const loadRates = async () => {
    if (!rooms.length) return;
    try {
      const results = await Promise.all(
        rooms.map(async (r) => {
          try {
            const rate = await getBaseRate(readId(r));
            return { roomId: readId(r), rate };
          } catch {
            return { roomId: readId(r), rate: null };
          }
        })
      );

      const nextMap: Record<string, BaseRate | null> = {};
      let detectedCurrency: string | null = null;
      for (const res of results) {
        nextMap[res.roomId] = res.rate;
        if (res.rate?.currency && !detectedCurrency) {
          detectedCurrency = res.rate.currency;
        }
      }
      setRatesMap(nextMap);
      if (detectedCurrency) setHotelCurrency(detectedCurrency);
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    void loadRates();
  }, [rooms]);

  const pricedCount = rooms.filter((r) => Boolean(ratesMap[readId(r)])).length;
  const missingCount = rooms.length - pricedCount;

  const handleSaveRate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoom) return;
    formErrors.clearErrors();

    const form = e.currentTarget;
    const f = new FormData(form);
    const amountRaw = String(f.get('amountMinorUnits') ?? '');
    const amountVal = Number(amountRaw);
    const currencyVal = String(f.get('currency')).trim().toUpperCase();
    const reasonVal = String(f.get('reason')).trim();

    if (!amountRaw || !Number.isSafeInteger(amountVal) || amountVal < 0) {
      toast.error('Enter a valid nightly rate.');
      return;
    }

    if (!currencyVal || currencyVal.length !== 3) {
      toast.error('Currency must be a 3-letter code');
      return;
    }

    if (!reasonVal || reasonVal.length < 3) {
      formErrors.setFieldErrors({ reason: 'Reason must be at least 3 characters' });
      return;
    }

    const roomId = readId(editingRoom);
    const currentRate = ratesMap[roomId];

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
        if (currentRate?.version !== undefined) {
          payload.version = currentRate.version;
        }

        const savedRate = await setBaseRate(roomId, payload);
        toast.success(`Base rate saved for ${editingRoom.name}.`);
        setRatesMap((prev) => ({ ...prev, [roomId]: savedRate }));
        setHotelCurrency(currencyVal);
        setEditingRoom(null);
        onRatesUpdated?.();
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  if (rooms.length === 0) {
    return (
      <EmptyState
        compact
        icon={<IndianRupee size={20} />}
        title="No room types yet"
        copy="Add room types in the Rooms tab first. Then you can configure nightly prices here."
      />
    );
  }

  const currentRate = editingRoom ? ratesMap[readId(editingRoom)] : null;
  const lockedCurrency = hotelCurrency || currentRate?.currency || null;

  return (
    <div className="space-y-6">
      {/* Shown only when something is missing; nothing to say when every room type has a rate. */}
      {missingCount > 0 && (
        <Alert tone="warning" icon={<AlertCircle size={16} />}>
          {missingCount} room {missingCount === 1 ? 'type is' : 'types are'} missing pricing. Every room type needs a base rate before the hotel can be published.
        </Alert>
      )}

      {/* Room Rates List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rooms.map((room) => {
          const roomId = readId(room);
          const rate = ratesMap[roomId];

          return (
            <div
              key={roomId}
              className="p-4 border border-slate-200/90 rounded-xl bg-white shadow-2xs flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <b className="font-semibold text-slate-900 text-sm">{room.name}</b>
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {room.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {room.totalRooms} rooms · up to {room.maxAdults} adults
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {rate ? (
                    <div>
                      <span className="text-[11px] text-slate-400 block">Nightly base price</span>
                      <strong className="text-base font-bold text-slate-900">
                        {formatMoney(rate.amountMinorUnits, rate.currency)}
                      </strong>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        No price configured
                      </span>
                    </div>
                  )}
                </div>

                {!readOnly && canEditRates && (
                  <Button
                    type="button"
                    variant={rate ? 'outline' : 'primary'}
                    size="sm"
                    leftIcon={rate ? <Edit3 size={12} /> : <Plus size={12} />}
                    onClick={() => setEditingRoom(room)}
                  >
                    {rate ? 'Edit price' : 'Set price'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Rate Modal */}
      {editingRoom && (
        <Modal closeOnBackdrop={false}
          title={`Set Base Rate — ${editingRoom.name}`}
          subtitle={`${editingRoom.code} · Base price per night before taxes`}
          onClose={() => setEditingRoom(null)}
        >
          <form onSubmit={handleSaveRate} className="space-y-4">
            {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}

            <Field
              label="Price per night"
              required
              hint="Price per night before tax, e.g. 3500 or 3500.50"
              error={formErrors.getError('amountMinorUnits')}
            >
              <MoneyInput
                name="amountMinorUnits"
                currency={lockedCurrency || DEFAULT_CURRENCY}
                defaultMinorUnits={currentRate?.amountMinorUnits}
                required
                key={`${readId(editingRoom)}-${currentRate?.amountMinorUnits}`}
              />
            </Field>

            <Field
              label="Currency"
              required
              hint={lockedCurrency ? 'Locked to property currency' : 'Choose currency for this hotel'}
            >
              {lockedCurrency ? (
                <>
                  <Input value={lockedCurrency} readOnly rightIcon={<Lock size={13} />} className="font-mono cursor-not-allowed" />
                  <input type="hidden" name="currency" value={lockedCurrency} />
                </>
              ) : (
                <Select name="currency" defaultValue={DEFAULT_CURRENCY}>
                  {RATE_CURRENCIES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </Select>
              )}
            </Field>

            <ReasonField
              name="reason"
              label="Reason for price"
              required
              placeholder="e.g. Initial base rate setup, seasonal revision"
              error={formErrors.getError('reason')}
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRoom(null)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={busy} loadingLabel="Saving rate…">
                Save rate
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
