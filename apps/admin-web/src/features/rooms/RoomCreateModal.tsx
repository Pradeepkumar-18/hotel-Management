import type { FormEvent } from 'react';
import { request } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Modal } from '../../components/ui';

export function RoomCreateModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      try {
        await request(`/admin/hotels/${hotelId}/room-types`, {
          method: 'POST',
          body: JSON.stringify({
            name: String(f.get('name')),
            code: String(f.get('code')),
            maxAdults: Number(f.get('adults')),
            maxChildren: Number(f.get('children')),
            totalRooms: Number(f.get('total')),
          }),
        });
        toast.success('Room type added.');
        onCreated();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not create room type');
      }
    });
  };

  return (
    <Modal title="Add a room type" subtitle="Set the sellable room count and guest capacity." onClose={onClose}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
        <Field label="Room name" required>
          <Input name="name" required placeholder="Courtyard king" />
        </Field>
        <Field label="Room code" required>
          <Input name="code" required placeholder="COURT-K" className="font-mono" />
        </Field>
        <Field label="Adults" required>
          <Input name="adults" type="number" min="1" max="30" required defaultValue="2" />
        </Field>
        <Field label="Children" required>
          <Input name="children" type="number" min="0" max="30" required defaultValue="0" />
        </Field>
        <Field label="Sellable rooms" fullWidth required>
          <Input name="total" type="number" min="0" max="10000" required defaultValue="8" />
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
