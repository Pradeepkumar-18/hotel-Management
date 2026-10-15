import type { FormEvent } from 'react';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Modal, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createRoomType } from './rooms.api';

export function RoomCreateModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      try {
        await createRoomType(hotelId, {
          name: String(f.get('name')),
          code: String(f.get('code')),
          maxAdults: Number(f.get('adults')),
          maxChildren: Number(f.get('children')),
          totalRooms: Number(f.get('total')),
        });
        toast.success('Room type added.');
        onCreated();
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <Modal title="Add a room type" subtitle="Set the sellable room count and guest capacity." onClose={onClose}>
      {formErrors.formError && (
        <div className="mb-4">
          <Alert tone="error">{formErrors.formError}</Alert>
        </div>
      )}
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
        <Field label="Room name" required error={formErrors.fieldErrors['name']}>
          <Input
            name="name"
            required
            placeholder="Courtyard king"
            isError={Boolean(formErrors.fieldErrors['name'])}
          />
        </Field>
        <Field label="Room code" required error={formErrors.fieldErrors['code']}>
          <Input
            name="code"
            required
            placeholder="COURT-K"
            className="font-mono"
            isError={Boolean(formErrors.fieldErrors['code'])}
          />
        </Field>
        <Field label="Adults" required error={formErrors.fieldErrors['maxAdults'] || formErrors.fieldErrors['adults']}>
          <Input
            name="adults"
            type="number"
            min="1"
            max="30"
            required
            defaultValue="2"
            isError={Boolean(formErrors.fieldErrors['maxAdults'] || formErrors.fieldErrors['adults'])}
          />
        </Field>
        <Field label="Children" required error={formErrors.fieldErrors['maxChildren'] || formErrors.fieldErrors['children']}>
          <Input
            name="children"
            type="number"
            min="0"
            max="30"
            required
            defaultValue="0"
            isError={Boolean(formErrors.fieldErrors['maxChildren'] || formErrors.fieldErrors['children'])}
          />
        </Field>
        <Field label="Sellable rooms" fullWidth required error={formErrors.fieldErrors['totalRooms'] || formErrors.fieldErrors['total']}>
          <Input
            name="total"
            type="number"
            min="0"
            max="10000"
            required
            defaultValue="8"
            isError={Boolean(formErrors.fieldErrors['totalRooms'] || formErrors.fieldErrors['total'])}
          />
        </Field>
        <div className="col-span-full pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
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
