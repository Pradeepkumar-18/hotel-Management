import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { HotelMediaItem, RoomType } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Alert, ReasonField } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { readId } from '../../utils/helpers';
import { createRoomType, updateRoomType } from './rooms.api';
import { RoomTypeFields, readRoomTypeFields } from './RoomTypeFields';
import { HotelMediaGalleryManager } from '../hotels/HotelMediaGalleryManager';

export interface RoomTypeFormProps {
  hotelId: string;
  hotelName?: string;
  room?: RoomType | null;
  onSuccess: (savedRoom: RoomType) => void;
  onCancel: () => void;
}

export function RoomTypeForm({ hotelId, room, onSuccess, onCancel }: RoomTypeFormProps) {
  const isEditing = Boolean(room);
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();
  // The API requires a reason when the sellable room count changes.
  const [total, setTotal] = useState(room?.totalRooms);
  const reasonRequired = isEditing && total !== room?.totalRooms;
  // Edit mode: Save stays disabled until something is changed.
  const [dirty, setDirty] = useState(false);
  // Room photos are saved with the room details in the same request.
  const [media, setMedia] = useState<HotelMediaItem[]>(room?.media ?? []);
  const [mediaDirty, setMediaDirty] = useState(false);
  const changeMedia = (next: HotelMediaItem[]) => {
    setMedia(next);
    setMediaDirty(true);
    setDirty(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);
    const { description, ...fields } = readRoomTypeFields(f);
    const reason = String(f.get('reason') ?? '').trim();

    void run(async () => {
      try {
        if (isEditing && room) {
          const updated = await updateRoomType(readId(room), {
            version: room.version,
            ...fields,
            description: description ?? '',
            ...(reason ? { reason } : {}),
            ...(mediaDirty ? { media } : {}),
          });
          toast.success(`Room type "${fields.name}" updated.`);
          onSuccess(updated);
        } else {
          const created = await createRoomType(hotelId, { ...fields, ...(description ? { description } : {}), ...(media.length ? { media } : {}) });
          toast.success(`Room type "${fields.name}" created.`);
          onSuccess(created);
        }
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} onChange={() => setDirty(true)} className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-6 sm:p-8 space-y-8">
      {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}

      <RoomTypeFields room={room} formErrors={formErrors} onTotalChange={setTotal} />

      <section className="pt-6 border-t border-slate-100 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room photos</h4>
          <p className="text-xs text-slate-500 mt-1">Add several photos at once, describe each one, and pick the cover. Saved with the room.</p>
        </div>
        <HotelMediaGalleryManager media={media} onChange={changeMedia} disabled={busy} />
      </section>

      {isEditing && (
        <section className="pt-6 border-t border-slate-100">
          <ReasonField
            name="reason"
            label="Reason for change"
            required={reasonRequired}
            hint={reasonRequired ? 'Required because the sellable room count changed.' : 'Optional; saved in the audit history.'}
            placeholder="e.g. Two rooms out of service after renovation"
            error={formErrors.getError('reason')}
          />
        </section>
      )}

      <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
        <Button type="button" variant="outline" size="md" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          leftIcon={<Check size={16} />}
          isLoading={busy}
          disabled={isEditing && !dirty}
          title={isEditing && !dirty ? 'Nothing to save yet' : undefined}
          loadingLabel={isEditing ? 'Saving…' : 'Creating…'}
        >
          {isEditing ? 'Save room changes' : 'Add room type'}
        </Button>
      </div>
    </form>
  );
}
