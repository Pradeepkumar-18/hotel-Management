import { FormEvent } from 'react';
import { BedDouble, Check } from 'lucide-react';
import { RoomType } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Textarea, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { readId } from '../../utils/helpers';
import { createRoomType, updateRoomType } from './rooms.api';

export interface RoomTypeFormProps {
  hotelId: string;
  hotelName?: string;
  room?: RoomType | null;
  onSuccess: (savedRoom: RoomType) => void;
  onCancel: () => void;
}

export function RoomTypeForm({
  hotelId,
  hotelName,
  room,
  onSuccess,
  onCancel,
}: RoomTypeFormProps) {
  const isEditing = Boolean(room);
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);

    const name = String(f.get('name') || '').trim();
    const code = String(f.get('code') || '').trim().toUpperCase();
    const adults = Number(f.get('adults'));
    const children = Number(f.get('children') || 0);
    const total = Number(f.get('total'));
    const description = String(f.get('description') || '').trim();
    const reason = String(f.get('reason') || '').trim();

    void run(async () => {
      try {
        if (isEditing && room) {
          const roomId = readId(room);
          const updatePayload: Parameters<typeof updateRoomType>[1] = {
            version: room.version,
            name,
            code,
            maxAdults: adults,
            maxChildren: children,
            totalRooms: total,
            ...(description ? { description } : {}),
            ...(reason ? { reason } : {}),
          };

          const updated = await updateRoomType(roomId, updatePayload);
          toast.success(`Room type "${name}" updated successfully.`);
          onSuccess(updated);
        } else {
          const created = await createRoomType(hotelId, {
            name,
            code,
            maxAdults: adults,
            maxChildren: children,
            totalRooms: total,
            ...(description ? { description } : {}),
          });
          toast.success(`Room type "${name}" created successfully.`);
          onSuccess(created);
        }
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-brand-primary flex items-center justify-center shrink-0">
            <BedDouble size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {isEditing ? `Edit Room Type: ${room?.name}` : 'Create New Room Type'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `Update capacity and sellable inventory for ${hotelName || 'this property'}.`
                : `Configure guest capacity and initial sellable inventory for ${hotelName || 'selected property'}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {formErrors.formError && (
          <Alert tone="error">{formErrors.formError}</Alert>
        )}

        {/* Section 1: Basic Information */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            General Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Room category name"
              required
              hint="e.g. Deluxe Ocean View Suite"
              error={formErrors.getError('name')}
            >
              <Input
                name="name"
                required
                defaultValue={room?.name || ''}
                placeholder="e.g. Deluxe Ocean View Suite"
                isError={Boolean(formErrors.getError('name'))}
              />
            </Field>

            <Field
              label="Room code"
              required
              hint="Unique identifier (e.g. DELUXE-OCEAN)"
              error={formErrors.getError('code')}
            >
              <Input
                name="code"
                required
                defaultValue={room?.code || ''}
                placeholder="DELUXE-OCEAN"
                className="font-mono uppercase"
                isError={Boolean(formErrors.getError('code'))}
              />
            </Field>

            <div className="col-span-full">
              <Field
                label="Description"
                hint="Describe room size, bed layouts, views, or special features (optional)."
                error={formErrors.getError('description')}
              >
                <Textarea
                  name="description"
                  rows={3}
                  defaultValue={room?.description || ''}
                  placeholder="Spacious room featuring a king-sized bed, en-suite bathroom, and panoramic city views..."
                  isError={Boolean(formErrors.getError('description'))}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Section 2: Guest Capacity & Sellable Inventory */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Occupancy & Sellable Capacity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field
              label="Maximum adults"
              required
              hint="Minimum 1 adult per room"
              error={formErrors.getError('maxAdults') || formErrors.getError('adults')}
            >
              <Input
                name="adults"
                type="number"
                min="1"
                max="30"
                required
                defaultValue={room?.maxAdults ?? 2}
                isError={Boolean(formErrors.getError('maxAdults') || formErrors.getError('adults'))}
              />
            </Field>

            <Field
              label="Maximum children"
              required
              hint="Accommodated children (0 if adult-only)"
              error={formErrors.getError('maxChildren') || formErrors.getError('children')}
            >
              <Input
                name="children"
                type="number"
                min="0"
                max="30"
                required
                defaultValue={room?.maxChildren ?? 0}
                isError={Boolean(formErrors.getError('maxChildren') || formErrors.getError('children'))}
              />
            </Field>

            <Field
              label="Total sellable rooms"
              required
              hint="Physical rooms available for distribution"
              error={formErrors.getError('totalRooms') || formErrors.getError('total')}
            >
              <Input
                name="total"
                type="number"
                min="0"
                max="10000"
                required
                defaultValue={room?.totalRooms ?? 10}
                isError={Boolean(formErrors.getError('totalRooms') || formErrors.getError('total'))}
              />
            </Field>
          </div>
        </div>

        {/* Section 3: Reason for Change (Edit Mode) */}
        {isEditing && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Audit Information
            </h4>
            <Field
              label="Reason for update"
              hint="Record why this room category is being modified for staff audit history (optional)."
              error={formErrors.getError('reason')}
            >
              <Input
                name="reason"
                placeholder="e.g. Adjusted sellable inventory following renovation"
                isError={Boolean(formErrors.getError('reason'))}
              />
            </Field>
          </div>
        )}

        {/* Form Actions Footer - Single Cancel button */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Check size={16} />}
              isLoading={busy}
              loadingLabel={isEditing ? 'Saving changes…' : 'Creating room type…'}
            >
              {isEditing ? 'Save room changes' : 'Add room type'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
