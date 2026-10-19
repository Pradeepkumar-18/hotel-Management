import type { FormEvent } from 'react';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Modal, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createRoomType } from './rooms.api';
import { RoomTypeFields, readRoomTypeFields } from './RoomTypeFields';

export function RoomCreateModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const { description: _description, ...fields } = readRoomTypeFields(new FormData(e.currentTarget));
    void run(async () => {
      try {
        await createRoomType(hotelId, fields);
        toast.success('Room type added.');
        onCreated();
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <Modal title="Add a room type" subtitle="Set the sellable room count and guest capacity." onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        {formErrors.formError && <Alert tone="error">{formErrors.formError}</Alert>}
        <RoomTypeFields formErrors={formErrors} compact />
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
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
