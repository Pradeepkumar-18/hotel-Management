import { useState } from 'react';
import { Check } from 'lucide-react';
import { HotelMediaItem, RoomType } from '../../api';
import { Alert, Button, Modal } from '../../components/ui';
import { useToast, useBusyGuard } from '../../ui-feedback';
import { handleFormError } from '../../hooks/handleFormError';
import { useServerErrors } from '../../hooks/useServerErrors';
import { updateRoomType } from './rooms.api';
import { HotelMediaGalleryManager } from '../hotels/HotelMediaGalleryManager';
import { readId } from '../../utils/helpers';

interface RoomMediaModalProps {
  room: RoomType;
  onClose: () => void;
  onSaved: (updatedRoom: RoomType) => void;
  readOnly?: boolean;
}

export function RoomMediaModal({ room, onClose, onSaved, readOnly = false }: RoomMediaModalProps) {
  const toast = useToast();
  const { busy, run } = useBusyGuard();
  const formErrors = useServerErrors();

  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(room.media || []);

  const handleSave = () => {
    formErrors.clearErrors();
    void run(async () => {
      try {
        const roomId = readId(room);
        const updated = await updateRoomType(roomId, {
          version: room.version,
          media: mediaList,
        });
        toast.success(`Photos saved for ${room.name}.`);
        onSaved(updated);
        onClose();
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <Modal closeOnBackdrop={false}
      title={`Photos — ${room.name}`}
      subtitle={`${room.code} · Upload and manage photos shown for this room type`}
      onClose={onClose}
      wide
    >
      <div className="space-y-6">
        {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}

        <HotelMediaGalleryManager
          media={mediaList}
          onChange={setMediaList}
          disabled={busy || readOnly}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {mediaList.length} photo{mediaList.length === 1 ? '' : 's'} attached to this room category.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            {!readOnly && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={14} />}
                isLoading={busy}
                loadingLabel="Saving room photos…"
                onClick={handleSave}
              >
                Save room photos
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
