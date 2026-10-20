import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Hotel, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createHotel } from './hotels.api';
import { readId } from '../../utils/helpers';
import { HotelMediaGalleryManager } from './HotelMediaGalleryManager';
import { HotelDetailsFields, readHotelDetails } from './HotelDetailsFields';

export interface HotelCreateFormProps {
  onSuccess: (createdHotel: Hotel) => void;
  onCancel: () => void;
}

export function HotelCreateForm({ onSuccess, onCancel }: HotelCreateFormProps) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>([]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const details = readHotelDetails(new FormData(e.currentTarget));

    void run(async () => {
      let created: Hotel;
      try {
        created = await createHotel(details);
      } catch (err) {
        handleFormError(err, formErrors, toast);
        return;
      }

      if (mediaList.length > 0) {
        try {
          const withMedia = await updateHotelMedia(readId(created), created.version, mediaList);
          toast.success(`"${details.name}" created with ${mediaList.length} photos.`);
          onSuccess(withMedia);
        } catch {
          toast.error(`"${details.name}" was created, but the photos could not be saved. Add them again in the Photos tab.`);
          onSuccess(created);
        }
        return;
      }

      toast.success(`"${details.name}" created as a draft.`);
      onSuccess(created);
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-6 sm:p-8 space-y-8"
    >
      {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}

      <HotelDetailsFields formErrors={formErrors} />

      <section className="pt-6 border-t border-slate-100 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Photos</h4>
          <p className="text-xs text-slate-500 mt-1">Optional. The first photo becomes the cover; you can change it later.</p>
        </div>
        <HotelMediaGalleryManager media={mediaList} onChange={setMediaList} disabled={busy} />
      </section>

      <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          The hotel is saved as a draft. Add rooms and a cancellation policy next, then publish.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="md" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Check size={16} />}
            isLoading={busy}
            loadingLabel="Creating…"
          >
            Create hotel
          </Button>
        </div>
      </div>
    </form>
  );
}
