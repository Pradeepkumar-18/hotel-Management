import { useState, type FormEvent } from 'react';
import { HotelMediaItem } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Modal, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createRoomType } from './rooms.api';
import { RoomTypeFields, readRoomTypeFields } from './RoomTypeFields';
import { HotelMediaGalleryManager } from '../hotels/HotelMediaGalleryManager';

/** Add a room type and its photos in one step (one create request). */
export function RoomCreateModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();
  const [media, setMedia] = useState<HotelMediaItem[]>([]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const { description: _description, ...fields } = readRoomTypeFields(new FormData(e.currentTarget));
    void run(async () => {
      try {
        await createRoomType(hotelId, { ...fields, ...(media.length ? { media } : {}) });
        toast.success(media.length ? `Room type added with ${media.length} ${media.length === 1 ? 'photo' : 'photos'}.` : 'Room type added.');
        onCreated();
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <Modal
      closeOnBackdrop={false}
      wide
      title="Add a room type"
      subtitle="Room details, guest capacity and photos — saved together."
      onClose={onClose}
    >
      <form className="space-y-6" onSubmit={submit}>
        {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}

        <RoomTypeFields formErrors={formErrors} compact />

        <section className="pt-5 border-t border-slate-100 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room photos</h4>
            <p className="text-xs text-slate-500 mt-1">Optional. The first photo becomes the cover for this room type.</p>
          </div>
          <HotelMediaGalleryManager media={media} onChange={setMedia} disabled={busy} />
        </section>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={busy} loadingLabel="Adding room type…">
            Add room type
          </Button>
        </div>
      </form>
    </Modal>
  );
}
